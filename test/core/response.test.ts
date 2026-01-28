/**
 * Unit tests for response unwrap helpers
 */

import { describe, it, expect } from 'vitest'
import { unwrap, unwrapList, unwrapOptional } from '../../src/core/response'
import type { OpenApiFetchResponse } from '../../src/core/response'
import {
  AlpacaError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from '../../src/core/errors'

describe('response helpers', () => {
  describe('unwrap', () => {
    it('should return data on success', () => {
      const mockResponse = new Response(null, { status: 200 })
      const result: OpenApiFetchResponse<{ id: string; name: string }> = {
        data: { id: '123', name: 'test' },
        error: undefined,
        response: mockResponse,
      }

      const data = unwrap(result)

      expect(data).toEqual({ id: '123', name: 'test' })
    })

    it('should throw AlpacaError on error response', () => {
      const mockResponse = new Response(null, { status: 400 })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: undefined,
        error: { message: 'Bad request', code: 40000 },
        response: mockResponse,
      }

      expect(() => unwrap(result)).toThrow(AlpacaError)
    })

    it('should throw AuthenticationError for 401 status', () => {
      const mockResponse = new Response(null, { status: 401 })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: undefined,
        error: { message: 'Invalid credentials', code: 40100 },
        response: mockResponse,
      }

      expect(() => unwrap(result)).toThrow(AuthenticationError)
    })

    it('should throw NotFoundError for 404 status', () => {
      const mockResponse = new Response(null, { status: 404 })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: undefined,
        error: { message: 'Resource not found', code: 40400 },
        response: mockResponse,
      }

      expect(() => unwrap(result)).toThrow(NotFoundError)
    })

    it('should throw RateLimitError for 429 status with retryAfter', () => {
      const headers = new Headers()
      headers.set('retry-after', '60')
      const mockResponse = new Response(null, { status: 429, headers })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: undefined,
        error: { message: 'Rate limited', code: 42900 },
        response: mockResponse,
      }

      try {
        unwrap(result)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError)
        expect((error as RateLimitError).retryAfter).toBe(60)
      }
    })

    it('should throw on null data', () => {
      const mockResponse = new Response(null, { status: 200 })
      const result: OpenApiFetchResponse<{ id: string } | null> = {
        data: null,
        error: undefined,
        response: mockResponse,
      }

      expect(() => unwrap(result)).toThrow('Unexpected empty response from API')
    })

    it('should throw on undefined data', () => {
      const mockResponse = new Response(null, { status: 200 })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: undefined,
        error: undefined,
        response: mockResponse,
      }

      expect(() => unwrap(result)).toThrow('Unexpected empty response from API')
    })

    it('should include requestId from response headers', () => {
      const headers = new Headers()
      headers.set('x-request-id', 'req-abc-123')
      const mockResponse = new Response(null, { status: 400, headers })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: undefined,
        error: { message: 'Bad request', code: 40000 },
        response: mockResponse,
      }

      try {
        unwrap(result)
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as AlpacaError).requestId).toBe('req-abc-123')
      }
    })
  })

  describe('unwrapList', () => {
    it('should return data array on success', () => {
      const mockResponse = new Response(null, { status: 200 })
      const result: OpenApiFetchResponse<{ id: string }[] | null> = {
        data: [{ id: '1' }, { id: '2' }, { id: '3' }],
        error: undefined,
        response: mockResponse,
      }

      const data = unwrapList(result)

      expect(data).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }])
    })

    it('should return empty array on null data', () => {
      const mockResponse = new Response(null, { status: 200 })
      const result: OpenApiFetchResponse<{ id: string }[] | null> = {
        data: null,
        error: undefined,
        response: mockResponse,
      }

      const data = unwrapList(result)

      expect(data).toEqual([])
    })

    it('should return empty array on undefined data', () => {
      const mockResponse = new Response(null, { status: 200 })
      const result: OpenApiFetchResponse<{ id: string }[] | null> = {
        data: undefined,
        error: undefined,
        response: mockResponse,
      }

      const data = unwrapList(result)

      expect(data).toEqual([])
    })

    it('should throw AlpacaError on error response', () => {
      const mockResponse = new Response(null, { status: 500 })
      const result: OpenApiFetchResponse<{ id: string }[] | null> = {
        data: undefined,
        error: { message: 'Server error', code: 50000 },
        response: mockResponse,
      }

      expect(() => unwrapList(result)).toThrow(AlpacaError)
    })

    it('should include requestId from response headers in error', () => {
      const headers = new Headers()
      headers.set('x-request-id', 'req-list-456')
      const mockResponse = new Response(null, { status: 403, headers })
      const result: OpenApiFetchResponse<{ id: string }[] | null> = {
        data: undefined,
        error: { message: 'Forbidden', code: 40300 },
        response: mockResponse,
      }

      try {
        unwrapList(result)
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as AlpacaError).requestId).toBe('req-list-456')
      }
    })
  })

  describe('unwrapOptional', () => {
    it('should return data on success', () => {
      const mockResponse = new Response(null, { status: 200 })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: { id: '123' },
        error: undefined,
        response: mockResponse,
      }

      const data = unwrapOptional(result)

      expect(data).toEqual({ id: '123' })
    })

    it('should return undefined on null data', () => {
      const mockResponse = new Response(null, { status: 200 })
      const result: OpenApiFetchResponse<{ id: string } | null> = {
        data: null,
        error: undefined,
        response: mockResponse,
      }

      const data = unwrapOptional(result)

      expect(data).toBeNull()
    })

    it('should return undefined on undefined data', () => {
      const mockResponse = new Response(null, { status: 204 })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: undefined,
        error: undefined,
        response: mockResponse,
      }

      const data = unwrapOptional(result)

      expect(data).toBeUndefined()
    })

    it('should throw AlpacaError on error response', () => {
      const mockResponse = new Response(null, { status: 422 })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: undefined,
        error: { message: 'Validation failed', code: 42200 },
        response: mockResponse,
      }

      expect(() => unwrapOptional(result)).toThrow(AlpacaError)
    })
  })

  describe('error extraction', () => {
    it('should handle error objects without message', () => {
      const mockResponse = new Response(null, { status: 500 })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: undefined,
        error: { code: 50000 },
        response: mockResponse,
      }

      try {
        unwrap(result)
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as AlpacaError).message).toBe('Unknown API error')
      }
    })

    it('should handle error objects without code', () => {
      const mockResponse = new Response(null, { status: 400 })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: undefined,
        error: { message: 'Something went wrong' },
        response: mockResponse,
      }

      try {
        unwrap(result)
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as AlpacaError).code).toBe(0)
      }
    })

    it('should handle completely empty error object', () => {
      const mockResponse = new Response(null, { status: 500 })
      const result: OpenApiFetchResponse<{ id: string }> = {
        data: undefined,
        error: {},
        response: mockResponse,
      }

      try {
        unwrap(result)
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as AlpacaError).message).toBe('Unknown API error')
        expect((error as AlpacaError).code).toBe(0)
      }
    })
  })
})
