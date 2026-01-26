/**
 * Base HTTP client for Alpaca SDK
 */

import type { AlpacaConfig, ResolvedAlpacaConfig, RequestOptions } from './types'
import { createAlpacaError, AlpacaError } from './errors'
import { createApiKeyAuth, createBasicAuth } from './auth'
import type { AuthHeaders } from './auth'

/** Base URLs for Alpaca APIs */
export const ALPACA_URLS = {
  trading: {
    paper: 'https://paper-api.alpaca.markets',
    live: 'https://api.alpaca.markets',
  },
  broker: {
    sandbox: 'https://broker-api.sandbox.alpaca.markets',
    live: 'https://broker-api.alpaca.markets',
  },
  marketData: 'https://data.alpaca.markets',
  stream: {
    data: 'wss://stream.data.alpaca.markets',
    trading: {
      paper: 'wss://paper-api.alpaca.markets/stream',
      live: 'wss://api.alpaca.markets/stream',
    },
  },
} as const

/** Default configuration values */
const DEFAULT_CONFIG = {
  paper: true,
  timeout: 30_000,
  maxRetries: 2,
} as const

/** Maximum retry backoff in milliseconds (5 minutes) to prevent DoS via malicious retry-after headers */
const MAX_RETRY_BACKOFF_MS = 5 * 60 * 1000

/**
 * Resolve configuration with defaults
 */
export function resolveConfig(
  config: AlpacaConfig,
  apiType: 'trading' | 'broker' | 'marketData'
): ResolvedAlpacaConfig {
  const paper = config.paper ?? DEFAULT_CONFIG.paper

  let baseUrl: string
  if (config.baseUrl) {
    baseUrl = config.baseUrl
  } else if (apiType === 'trading') {
    baseUrl = paper ? ALPACA_URLS.trading.paper : ALPACA_URLS.trading.live
  } else if (apiType === 'broker') {
    baseUrl = paper ? ALPACA_URLS.broker.sandbox : ALPACA_URLS.broker.live
  } else {
    baseUrl = ALPACA_URLS.marketData
  }

  return {
    keyId: config.keyId,
    secretKey: config.secretKey,
    paper,
    timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
    maxRetries: config.maxRetries ?? DEFAULT_CONFIG.maxRetries,
    baseUrl,
  }
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff with jitter
 */
function calculateBackoff(attempt: number, baseMs = 1000): number {
  const exponential = Math.min(baseMs * Math.pow(2, attempt), 30_000)
  const jitter = Math.random() * 1000
  return exponential + jitter
}

/**
 * Check if error is retryable
 */
function isRetryable(status: number): boolean {
  return status === 429 || status >= 500
}

interface AlpacaApiError {
  code: number
  message: string
}

/**
 * Base fetch client with retry logic
 */
export async function fetchWithRetry<T>(
  url: string,
  init: RequestInit,
  config: ResolvedAlpacaConfig,
  options?: RequestOptions
): Promise<T> {
  const timeout = options?.timeout ?? config.timeout
  let lastError: AlpacaError | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, timeout)

    // Combine signals if user provided one
    const signal = options?.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal

    try {
      const response = await fetch(url, {
        ...init,
        signal,
      })

      clearTimeout(timeoutId)

      const requestId = response.headers.get('x-request-id') ?? undefined

      if (!response.ok) {
        const retryAfter = response.headers.get('retry-after')
        const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined

        let errorBody: AlpacaApiError
        try {
          errorBody = (await response.json()) as AlpacaApiError
        } catch (parseError) {
          // Only handle JSON parse errors (non-JSON responses like HTML error pages)
          // Re-throw other errors (network issues, memory errors, etc.)
          if (parseError instanceof SyntaxError) {
            errorBody = { code: 0, message: response.statusText }
          } else {
            throw parseError
          }
        }

        const error = createAlpacaError(
          errorBody.message,
          errorBody.code,
          response.status,
          requestId,
          retryAfterMs ? retryAfterMs / 1000 : undefined
        )

        if (isRetryable(response.status) && attempt < config.maxRetries) {
          lastError = error
          // Cap backoff to prevent DoS via malicious retry-after headers
          const rawBackoff = retryAfterMs ?? calculateBackoff(attempt)
          const backoff = Math.min(rawBackoff, MAX_RETRY_BACKOFF_MS)
          await sleep(backoff)
          continue
        }

        throw error
      }

      // Handle empty responses (204 No Content)
      // Note: Callers expecting 204 responses should type T to include undefined,
      // or use this function only for endpoints that don't return 204.
      if (response.status === 204) {
        return undefined as unknown as T
      }

      return (await response.json()) as T
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof AlpacaError) {
        throw error
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AlpacaError('Request timeout', 'unknown', 0, 408)
      }

      throw new AlpacaError(
        error instanceof Error ? error.message : 'Unknown error',
        'unknown',
        0,
        0
      )
    }
  }

  throw lastError ?? new AlpacaError('Max retries exceeded', 'unknown', 0, 0)
}

/**
 * Create headers for API request
 */
export function createHeaders(auth: AuthHeaders, options?: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...auth,
  }

  if (options?.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey
  }

  return headers
}

/**
 * Create a configured fetch function for a specific API
 */
export function createApiFetch(
  config: ResolvedAlpacaConfig,
  authType: 'apiKey' | 'basic' = 'apiKey'
) {
  const auth =
    authType === 'basic'
      ? createBasicAuth(config.keyId, config.secretKey)
      : createApiKeyAuth(config.keyId, config.secretKey)

  return async function apiFetch<T>(
    path: string,
    init: RequestInit = {},
    options?: RequestOptions
  ): Promise<T> {
    const url = `${config.baseUrl}${path}`
    const headers = createHeaders(auth, options)

    return fetchWithRetry<T>(
      url,
      {
        ...init,
        headers: {
          ...headers,
          ...(init.headers as Record<string, string> | undefined),
        },
      },
      config,
      options
    )
  }
}
