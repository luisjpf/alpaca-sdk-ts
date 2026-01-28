/**
 * Unit tests for client utilities
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse, delay } from 'msw'
import {
  resolveConfig,
  fetchWithRetry,
  createHeaders,
  createApiFetch,
  ALPACA_URLS,
} from '../../src/core/client'
import {
  AlpacaError,
  AuthenticationError,
  RateLimitError,
  ServerError,
} from '../../src/core/errors'
import type { ResolvedAlpacaConfig } from '../../src/core/types'

// MSW server setup
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})

describe('client', () => {
  describe('resolveConfig', () => {
    const baseConfig = {
      keyId: 'test-key',
      secretKey: 'test-secret',
    }

    describe('trading API', () => {
      it('should use paper trading URL when paper is true', () => {
        const result = resolveConfig({ ...baseConfig, paper: true }, 'trading')

        expect(result.baseUrl).toBe(ALPACA_URLS.trading.paper)
        expect(result.paper).toBe(true)
      })

      it('should use live trading URL when paper is false', () => {
        const result = resolveConfig({ ...baseConfig, paper: false }, 'trading')

        expect(result.baseUrl).toBe(ALPACA_URLS.trading.live)
        expect(result.paper).toBe(false)
      })

      it('should default to paper trading when paper is not specified', () => {
        const result = resolveConfig(baseConfig, 'trading')

        expect(result.baseUrl).toBe(ALPACA_URLS.trading.paper)
        expect(result.paper).toBe(true)
      })
    })

    describe('broker API', () => {
      it('should use sandbox broker URL when paper is true', () => {
        const result = resolveConfig({ ...baseConfig, paper: true }, 'broker')

        expect(result.baseUrl).toBe(ALPACA_URLS.broker.sandbox)
      })

      it('should use live broker URL when paper is false', () => {
        const result = resolveConfig({ ...baseConfig, paper: false }, 'broker')

        expect(result.baseUrl).toBe(ALPACA_URLS.broker.live)
      })
    })

    describe('marketData API', () => {
      it('should use marketData URL regardless of paper mode', () => {
        const resultPaper = resolveConfig({ ...baseConfig, paper: true }, 'marketData')
        const resultLive = resolveConfig({ ...baseConfig, paper: false }, 'marketData')

        expect(resultPaper.baseUrl).toBe(ALPACA_URLS.marketData)
        expect(resultLive.baseUrl).toBe(ALPACA_URLS.marketData)
      })
    })

    describe('custom baseUrl', () => {
      it('should use custom baseUrl when provided', () => {
        const customUrl = 'https://custom.alpaca.test'
        const result = resolveConfig({ ...baseConfig, baseUrl: customUrl }, 'trading')

        expect(result.baseUrl).toBe(customUrl)
      })

      it('should prefer custom baseUrl over default URLs', () => {
        const customUrl = 'https://my-proxy.example.com'
        const result = resolveConfig({ ...baseConfig, baseUrl: customUrl, paper: false }, 'trading')

        expect(result.baseUrl).toBe(customUrl)
        expect(result.baseUrl).not.toBe(ALPACA_URLS.trading.live)
      })
    })

    describe('defaults', () => {
      it('should apply default timeout of 30000ms', () => {
        const result = resolveConfig(baseConfig, 'trading')

        expect(result.timeout).toBe(30000)
      })

      it('should apply default maxRetries of 2', () => {
        const result = resolveConfig(baseConfig, 'trading')

        expect(result.maxRetries).toBe(2)
      })

      it('should use provided timeout when specified', () => {
        const result = resolveConfig({ ...baseConfig, timeout: 60000 }, 'trading')

        expect(result.timeout).toBe(60000)
      })

      it('should use provided maxRetries when specified', () => {
        const result = resolveConfig({ ...baseConfig, maxRetries: 5 }, 'trading')

        expect(result.maxRetries).toBe(5)
      })

      it('should preserve keyId and secretKey', () => {
        const result = resolveConfig(baseConfig, 'trading')

        expect(result.keyId).toBe('test-key')
        expect(result.secretKey).toBe('test-secret')
      })
    })
  })

  describe('createHeaders', () => {
    it('should include Content-Type application/json', () => {
      const auth = { 'APCA-API-KEY-ID': 'key', 'APCA-API-SECRET-KEY': 'secret' }

      const result = createHeaders(auth)

      expect(result['Content-Type']).toBe('application/json')
    })

    it('should include auth headers', () => {
      const auth = { 'APCA-API-KEY-ID': 'my-key', 'APCA-API-SECRET-KEY': 'my-secret' }

      const result = createHeaders(auth)

      expect(result['APCA-API-KEY-ID']).toBe('my-key')
      expect(result['APCA-API-SECRET-KEY']).toBe('my-secret')
    })

    it('should include idempotency key when provided', () => {
      const auth = { Authorization: 'Bearer token' }

      const result = createHeaders(auth, { idempotencyKey: 'unique-id-123' })

      expect(result['Idempotency-Key']).toBe('unique-id-123')
    })

    it('should not include idempotency key when not provided', () => {
      const auth = { Authorization: 'Bearer token' }

      const result = createHeaders(auth)

      expect(result['Idempotency-Key']).toBeUndefined()
    })

    it('should work with Basic auth headers', () => {
      const auth = { Authorization: 'Basic dGVzdDp0ZXN0' }

      const result = createHeaders(auth)

      expect(result.Authorization).toBe('Basic dGVzdDp0ZXN0')
      expect(result['Content-Type']).toBe('application/json')
    })
  })

  describe('fetchWithRetry', () => {
    const testConfig: ResolvedAlpacaConfig = {
      keyId: 'test-key',
      secretKey: 'test-secret',
      paper: true,
      timeout: 5000,
      maxRetries: 2,
      baseUrl: 'https://api.test.alpaca.markets',
    }

    describe('successful responses', () => {
      it('should return parsed JSON for successful response', async () => {
        const mockData = { id: '123', symbol: 'AAPL', qty: 100 }

        server.use(
          http.get('https://api.test.alpaca.markets/v2/orders/123', () => {
            return HttpResponse.json(mockData)
          })
        )

        const result = await fetchWithRetry<typeof mockData>(
          'https://api.test.alpaca.markets/v2/orders/123',
          { method: 'GET' },
          testConfig
        )

        expect(result).toEqual(mockData)
      })

      it('should return undefined for 204 No Content', async () => {
        server.use(
          http.delete('https://api.test.alpaca.markets/v2/orders/456', () => {
            return new HttpResponse(null, { status: 204 })
          })
        )

        const result = await fetchWithRetry(
          'https://api.test.alpaca.markets/v2/orders/456',
          { method: 'DELETE' },
          testConfig
        )

        expect(result).toBeUndefined()
      })
    })

    describe('error responses', () => {
      it('should throw AuthenticationError for 401 response', async () => {
        server.use(
          http.get('https://api.test.alpaca.markets/v2/account', () => {
            return HttpResponse.json(
              { code: 40100, message: 'Invalid API key' },
              {
                status: 401,
                headers: { 'x-request-id': 'req-auth-error' },
              }
            )
          })
        )

        await expect(
          fetchWithRetry(
            'https://api.test.alpaca.markets/v2/account',
            { method: 'GET' },
            testConfig
          )
        ).rejects.toThrow(AuthenticationError)
      })

      it('should throw AlpacaError with correct status code', async () => {
        server.use(
          http.get('https://api.test.alpaca.markets/v2/test', () => {
            return HttpResponse.json({ code: 40000, message: 'Bad request' }, { status: 400 })
          })
        )

        try {
          await fetchWithRetry(
            'https://api.test.alpaca.markets/v2/test',
            { method: 'GET' },
            testConfig
          )
          expect.fail('Should have thrown')
        } catch (error) {
          expect(error).toBeInstanceOf(AlpacaError)
          expect((error as AlpacaError).status).toBe(400)
        }
      })

      it('should include requestId from response headers', async () => {
        server.use(
          http.get('https://api.test.alpaca.markets/v2/fail', () => {
            return HttpResponse.json(
              { code: 40400, message: 'Not found' },
              {
                status: 404,
                headers: { 'x-request-id': 'req-12345' },
              }
            )
          })
        )

        try {
          await fetchWithRetry(
            'https://api.test.alpaca.markets/v2/fail',
            { method: 'GET' },
            testConfig
          )
          expect.fail('Should have thrown')
        } catch (error) {
          expect((error as AlpacaError).requestId).toBe('req-12345')
        }
      })
    })

    describe('retry logic', () => {
      it('should retry on 429 rate limit', async () => {
        let requestCount = 0

        server.use(
          http.get('https://api.test.alpaca.markets/v2/retry-rate', () => {
            requestCount++
            if (requestCount === 1) {
              return HttpResponse.json(
                { code: 42900, message: 'Rate limited' },
                {
                  status: 429,
                  headers: { 'retry-after': '1' },
                }
              )
            }
            return HttpResponse.json({ success: true })
          })
        )

        const configWithFastRetry = { ...testConfig, maxRetries: 1 }
        const result = await fetchWithRetry<{ success: boolean }>(
          'https://api.test.alpaca.markets/v2/retry-rate',
          { method: 'GET' },
          configWithFastRetry
        )

        expect(requestCount).toBe(2)
        expect(result.success).toBe(true)
      })

      it('should retry on 500 server error', async () => {
        let requestCount = 0

        server.use(
          http.get('https://api.test.alpaca.markets/v2/retry-server', () => {
            requestCount++
            if (requestCount === 1) {
              return HttpResponse.json({ code: 50000, message: 'Internal error' }, { status: 500 })
            }
            return HttpResponse.json({ data: 'recovered' })
          })
        )

        const configWithFastRetry = { ...testConfig, maxRetries: 1 }
        const result = await fetchWithRetry<{ data: string }>(
          'https://api.test.alpaca.markets/v2/retry-server',
          { method: 'GET' },
          configWithFastRetry
        )

        expect(requestCount).toBe(2)
        expect(result.data).toBe('recovered')
      })

      it('should throw after max retries exceeded', async () => {
        server.use(
          http.get('https://api.test.alpaca.markets/v2/always-fail', () => {
            return HttpResponse.json({ code: 50000, message: 'Always failing' }, { status: 500 })
          })
        )

        const configWithRetries = { ...testConfig, maxRetries: 1 }

        await expect(
          fetchWithRetry(
            'https://api.test.alpaca.markets/v2/always-fail',
            { method: 'GET' },
            configWithRetries
          )
        ).rejects.toThrow(ServerError)
      })

      it('should not retry on 400 client errors', async () => {
        let requestCount = 0

        server.use(
          http.get('https://api.test.alpaca.markets/v2/no-retry', () => {
            requestCount++
            return HttpResponse.json({ code: 40000, message: 'Bad request' }, { status: 400 })
          })
        )

        await expect(
          fetchWithRetry(
            'https://api.test.alpaca.markets/v2/no-retry',
            { method: 'GET' },
            testConfig
          )
        ).rejects.toThrow(AlpacaError)

        expect(requestCount).toBe(1)
      })

      it('should parse retry-after header for RateLimitError', async () => {
        server.use(
          http.get('https://api.test.alpaca.markets/v2/rate-limit-info', () => {
            return HttpResponse.json(
              { code: 42900, message: 'Rate limited' },
              {
                status: 429,
                headers: { 'retry-after': '120' },
              }
            )
          })
        )

        const configNoRetry = { ...testConfig, maxRetries: 0 }

        try {
          await fetchWithRetry(
            'https://api.test.alpaca.markets/v2/rate-limit-info',
            { method: 'GET' },
            configNoRetry
          )
          expect.fail('Should have thrown')
        } catch (error) {
          expect(error).toBeInstanceOf(RateLimitError)
          expect((error as RateLimitError).retryAfter).toBe(120)
        }
      })
    })

    describe('timeout', () => {
      it('should throw timeout error when request exceeds timeout', async () => {
        server.use(
          http.get('https://api.test.alpaca.markets/v2/slow', async () => {
            await delay(3000)
            return HttpResponse.json({ data: 'slow' })
          })
        )

        const configWithShortTimeout = { ...testConfig, timeout: 100, maxRetries: 0 }

        await expect(
          fetchWithRetry(
            'https://api.test.alpaca.markets/v2/slow',
            { method: 'GET' },
            configWithShortTimeout
          )
        ).rejects.toThrow('Request timeout')
      })

      it('should use options timeout over config timeout', async () => {
        server.use(
          http.get('https://api.test.alpaca.markets/v2/timeout-override', async () => {
            await delay(200)
            return HttpResponse.json({ data: 'success' })
          })
        )

        const configWithLongTimeout = { ...testConfig, timeout: 5000, maxRetries: 0 }

        await expect(
          fetchWithRetry(
            'https://api.test.alpaca.markets/v2/timeout-override',
            { method: 'GET' },
            configWithLongTimeout,
            { timeout: 50 }
          )
        ).rejects.toThrow('Request timeout')
      })
    })

    describe('error handling edge cases', () => {
      it('should handle non-JSON error responses', async () => {
        server.use(
          http.get('https://api.test.alpaca.markets/v2/html-error', () => {
            return new HttpResponse('<html>Error</html>', {
              status: 502,
              headers: { 'Content-Type': 'text/html' },
            })
          })
        )

        const configNoRetry = { ...testConfig, maxRetries: 0 }

        try {
          await fetchWithRetry(
            'https://api.test.alpaca.markets/v2/html-error',
            { method: 'GET' },
            configNoRetry
          )
          expect.fail('Should have thrown')
        } catch (error) {
          expect(error).toBeInstanceOf(AlpacaError)
          // Should use statusText when JSON parsing fails
          expect((error as AlpacaError).message).toBe('Bad Gateway')
        }
      })

      it('should re-throw non-SyntaxError during JSON parsing (wrapped as AlpacaError)', async () => {
        // Create a custom error that's not a SyntaxError
        const customError = new TypeError('Body already consumed')

        // Mock global fetch to return a response that throws on .json()
        const originalFetch = global.fetch
        global.fetch = async () => {
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            headers: new Headers({ 'x-request-id': 'test-123' }),
            json: () => {
              throw customError
            },
          } as Response
        }

        const configNoRetry = { ...testConfig, maxRetries: 0 }

        try {
          await fetchWithRetry(
            'https://api.test.alpaca.markets/v2/custom-error',
            { method: 'GET' },
            configNoRetry
          )
          expect.fail('Should have thrown')
        } catch (error) {
          // The error is re-thrown but then caught by the outer catch block
          // which wraps non-AlpacaError into AlpacaError
          expect(error).toBeInstanceOf(AlpacaError)
          expect((error as AlpacaError).message).toBe('Body already consumed')
        } finally {
          global.fetch = originalFetch
        }
      })
    })

    describe('network failures', () => {
      it('should throw AlpacaError on network failure', async () => {
        server.use(
          http.get('https://api.test.alpaca.markets/v2/network-fail', () => {
            return HttpResponse.error()
          })
        )

        const configNoRetry = { ...testConfig, maxRetries: 0 }

        await expect(
          fetchWithRetry(
            'https://api.test.alpaca.markets/v2/network-fail',
            { method: 'GET' },
            configNoRetry
          )
        ).rejects.toThrow(AlpacaError)
      })

      it('should throw timeout error for aborted requests', async () => {
        server.use(
          http.get('https://api.test.alpaca.markets/v2/abort-test', async () => {
            await delay(1000)
            return HttpResponse.json({ data: 'slow' })
          })
        )

        const configNoRetry = { ...testConfig, maxRetries: 0 }
        const controller = new AbortController()

        // Abort immediately
        setTimeout(() => {
          controller.abort()
        }, 10)

        await expect(
          fetchWithRetry(
            'https://api.test.alpaca.markets/v2/abort-test',
            { method: 'GET' },
            configNoRetry,
            { signal: controller.signal }
          )
        ).rejects.toThrow('Request timeout')
      })

      it('should respect user-provided AbortSignal', async () => {
        server.use(
          http.get('https://api.test.alpaca.markets/v2/user-abort', async () => {
            await delay(5000)
            return HttpResponse.json({ data: 'very slow' })
          })
        )

        const configWithLongTimeout = { ...testConfig, timeout: 10000, maxRetries: 0 }
        const controller = new AbortController()

        // Abort after 50ms (before timeout would trigger)
        const abortPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            controller.abort()
            resolve()
          }, 50)
        })

        await expect(
          Promise.all([
            fetchWithRetry(
              'https://api.test.alpaca.markets/v2/user-abort',
              { method: 'GET' },
              configWithLongTimeout,
              { signal: controller.signal }
            ),
            abortPromise,
          ])
        ).rejects.toThrow('Request timeout')
      })
    })
  })

  describe('createApiFetch', () => {
    const testConfig: ResolvedAlpacaConfig = {
      keyId: 'api-key-123',
      secretKey: 'api-secret-456',
      paper: true,
      timeout: 5000,
      maxRetries: 0,
      baseUrl: 'https://api.test.alpaca.markets',
    }

    it('should create fetch function that makes requests to baseUrl + path', async () => {
      server.use(
        http.get('https://api.test.alpaca.markets/v2/account', () => {
          return HttpResponse.json({ id: 'account-123', status: 'ACTIVE' })
        })
      )

      const apiFetch = createApiFetch(testConfig)
      const result = await apiFetch<{ id: string; status: string }>('/v2/account')

      expect(result.id).toBe('account-123')
      expect(result.status).toBe('ACTIVE')
    })

    it('should include API key auth headers by default', async () => {
      let capturedKeyId: string | null = null
      let capturedSecretKey: string | null = null

      server.use(
        http.get('https://api.test.alpaca.markets/v2/positions', ({ request }) => {
          capturedKeyId = request.headers.get('APCA-API-KEY-ID')
          capturedSecretKey = request.headers.get('APCA-API-SECRET-KEY')
          return HttpResponse.json([])
        })
      )

      const apiFetch = createApiFetch(testConfig)
      await apiFetch('/v2/positions')

      expect(capturedKeyId).toBe('api-key-123')
      expect(capturedSecretKey).toBe('api-secret-456')
    })

    it('should include Basic auth headers when authType is basic', async () => {
      let capturedAuthHeader: string | null = null

      server.use(
        http.get('https://api.test.alpaca.markets/v1/accounts', ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization')
          return HttpResponse.json([])
        })
      )

      const apiFetch = createApiFetch(testConfig, 'basic')
      await apiFetch('/v1/accounts')

      expect(capturedAuthHeader).toMatch(/^Basic /)
      // Verify it's the correct base64 encoded credentials
      const expectedBase64 = btoa(`${testConfig.keyId}:${testConfig.secretKey}`)
      expect(capturedAuthHeader).toBe(`Basic ${expectedBase64}`)
    })

    it('should include Content-Type header', async () => {
      let capturedContentType: string | null = null

      server.use(
        http.post('https://api.test.alpaca.markets/v2/orders', ({ request }) => {
          capturedContentType = request.headers.get('Content-Type')
          return HttpResponse.json({ id: 'order-123' })
        })
      )

      const apiFetch = createApiFetch(testConfig)
      await apiFetch('/v2/orders', { method: 'POST', body: JSON.stringify({ symbol: 'AAPL' }) })

      expect(capturedContentType).toBe('application/json')
    })

    it('should include idempotency key when provided in options', async () => {
      let capturedIdempotencyKey: string | null = null

      server.use(
        http.post('https://api.test.alpaca.markets/v2/orders', ({ request }) => {
          capturedIdempotencyKey = request.headers.get('Idempotency-Key')
          return HttpResponse.json({ id: 'order-456' })
        })
      )

      const apiFetch = createApiFetch(testConfig)
      await apiFetch(
        '/v2/orders',
        { method: 'POST', body: JSON.stringify({ symbol: 'GOOG' }) },
        { idempotencyKey: 'unique-order-key-789' }
      )

      expect(capturedIdempotencyKey).toBe('unique-order-key-789')
    })

    it('should allow overriding headers in init', async () => {
      let capturedCustomHeader: string | null = null
      let capturedKeyId: string | null = null

      server.use(
        http.get('https://api.test.alpaca.markets/v2/custom', ({ request }) => {
          capturedCustomHeader = request.headers.get('X-Custom-Header')
          capturedKeyId = request.headers.get('APCA-API-KEY-ID')
          return HttpResponse.json({})
        })
      )

      const apiFetch = createApiFetch(testConfig)
      await apiFetch('/v2/custom', {
        headers: { 'X-Custom-Header': 'custom-value' },
      })

      expect(capturedCustomHeader).toBe('custom-value')
      // Should still have auth headers
      expect(capturedKeyId).toBe('api-key-123')
    })
  })

  describe('ALPACA_URLS', () => {
    it('should have correct trading URLs', () => {
      expect(ALPACA_URLS.trading.paper).toBe('https://paper-api.alpaca.markets')
      expect(ALPACA_URLS.trading.live).toBe('https://api.alpaca.markets')
    })

    it('should have correct broker URLs', () => {
      expect(ALPACA_URLS.broker.sandbox).toBe('https://broker-api.sandbox.alpaca.markets')
      expect(ALPACA_URLS.broker.live).toBe('https://broker-api.alpaca.markets')
    })

    it('should have correct marketData URL', () => {
      expect(ALPACA_URLS.marketData).toBe('https://data.alpaca.markets')
    })

    it('should have correct stream URLs', () => {
      expect(ALPACA_URLS.stream.data).toBe('wss://stream.data.alpaca.markets')
      expect(ALPACA_URLS.stream.trading.paper).toBe('wss://paper-api.alpaca.markets/stream')
      expect(ALPACA_URLS.stream.trading.live).toBe('wss://api.alpaca.markets/stream')
    })
  })
})
