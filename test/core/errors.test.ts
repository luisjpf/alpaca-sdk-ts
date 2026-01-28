/**
 * Unit tests for error classes, types, and utilities
 */

import { describe, it, expect } from 'vitest'
import {
  // Error type constants
  ErrorType,
  // Error classes
  AlpacaError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  InsufficientFundsError,
  MarketClosedError,
  ServerError,
  // Factory functions
  createAlpacaError,
  createApiError,
  toApiError,
  // Result helpers
  ok,
  err,
  // Type guards
  isApiError,
  isAuthenticationError,
  isRateLimitError,
  isNotFoundError,
  isValidationError,
  isInsufficientFundsError,
  isMarketClosedError,
  isServerError,
} from '../../src/core/errors'
import type { ApiError, Result } from '../../src/core/errors'

describe('errors', () => {
  describe('ErrorType constants', () => {
    it('should have all expected error types', () => {
      expect(ErrorType.Authentication).toBe('authentication')
      expect(ErrorType.Forbidden).toBe('forbidden')
      expect(ErrorType.NotFound).toBe('not_found')
      expect(ErrorType.Validation).toBe('validation')
      expect(ErrorType.RateLimit).toBe('rate_limit')
      expect(ErrorType.InsufficientFunds).toBe('insufficient_funds')
      expect(ErrorType.MarketClosed).toBe('market_closed')
      expect(ErrorType.Server).toBe('server')
      expect(ErrorType.Unknown).toBe('unknown')
    })

    it('should be usable as type values', () => {
      const errorType: typeof ErrorType.Authentication = 'authentication'
      expect(errorType).toBe(ErrorType.Authentication)
    })
  })

  describe('AlpacaError', () => {
    it('should create error with message, type, code, status, and requestId', () => {
      const error = new AlpacaError('Test error', ErrorType.Unknown, 1001, 400, 'req-123')

      expect(error.message).toBe('Test error')
      expect(error.type).toBe('unknown')
      expect(error.code).toBe(1001)
      expect(error.status).toBe(400)
      expect(error.requestId).toBe('req-123')
    })

    it('should have name set to "AlpacaError"', () => {
      const error = new AlpacaError('Test', ErrorType.Unknown, 0, 500)

      expect(error.name).toBe('AlpacaError')
    })

    it('should extend Error', () => {
      const error = new AlpacaError('Test', ErrorType.Unknown, 0, 500)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AlpacaError)
    })

    it('should work without requestId', () => {
      const error = new AlpacaError('Test', ErrorType.Unknown, 100, 500)

      expect(error.requestId).toBeUndefined()
    })

    it('should convert to ApiError via toApiError()', () => {
      const error = new AlpacaError('Test', ErrorType.Unknown, 100, 400, 'req-abc')
      const apiError = error.toApiError()

      expect(apiError.type).toBe('unknown')
      expect(apiError.message).toBe('Test')
      expect(apiError.code).toBe(100)
      expect(apiError.status).toBe(400)
      expect(apiError.requestId).toBe('req-abc')
    })
  })

  describe('AuthenticationError', () => {
    it('should create error with status 401 and correct type', () => {
      const error = new AuthenticationError('Invalid credentials', 40100, 'req-456')

      expect(error.message).toBe('Invalid credentials')
      expect(error.type).toBe('authentication')
      expect(error.code).toBe(40100)
      expect(error.status).toBe(401)
      expect(error.requestId).toBe('req-456')
    })

    it('should have name set to "AuthenticationError"', () => {
      const error = new AuthenticationError('Test', 0)

      expect(error.name).toBe('AuthenticationError')
    })

    it('should extend AlpacaError', () => {
      const error = new AuthenticationError('Test', 0)

      expect(error).toBeInstanceOf(AlpacaError)
      expect(error).toBeInstanceOf(AuthenticationError)
    })
  })

  describe('ForbiddenError', () => {
    it('should create error with status 403 and correct type', () => {
      const error = new ForbiddenError('Access denied', 40300, 'req-789')

      expect(error.message).toBe('Access denied')
      expect(error.type).toBe('forbidden')
      expect(error.code).toBe(40300)
      expect(error.status).toBe(403)
      expect(error.requestId).toBe('req-789')
    })

    it('should have name set to "ForbiddenError"', () => {
      const error = new ForbiddenError('Test', 0)

      expect(error.name).toBe('ForbiddenError')
    })

    it('should extend AlpacaError', () => {
      const error = new ForbiddenError('Test', 0)

      expect(error).toBeInstanceOf(AlpacaError)
    })
  })

  describe('NotFoundError', () => {
    it('should create error with status 404 and correct type', () => {
      const error = new NotFoundError('Resource not found', 40400)

      expect(error.message).toBe('Resource not found')
      expect(error.type).toBe('not_found')
      expect(error.code).toBe(40400)
      expect(error.status).toBe(404)
    })

    it('should have name set to "NotFoundError"', () => {
      const error = new NotFoundError('Test', 0)

      expect(error.name).toBe('NotFoundError')
    })

    it('should extend AlpacaError', () => {
      const error = new NotFoundError('Test', 0)

      expect(error).toBeInstanceOf(AlpacaError)
    })
  })

  describe('ValidationError', () => {
    it('should create error with status 422 and correct type', () => {
      const error = new ValidationError('Invalid input', 42200)

      expect(error.message).toBe('Invalid input')
      expect(error.type).toBe('validation')
      expect(error.code).toBe(42200)
      expect(error.status).toBe(422)
    })

    it('should have name set to "ValidationError"', () => {
      const error = new ValidationError('Test', 0)

      expect(error.name).toBe('ValidationError')
    })

    it('should extend AlpacaError', () => {
      const error = new ValidationError('Test', 0)

      expect(error).toBeInstanceOf(AlpacaError)
    })
  })

  describe('RateLimitError', () => {
    it('should create error with status 429, correct type, and retryAfter', () => {
      const error = new RateLimitError('Too many requests', 42900, 'req-ratelimit', 60)

      expect(error.message).toBe('Too many requests')
      expect(error.type).toBe('rate_limit')
      expect(error.code).toBe(42900)
      expect(error.status).toBe(429)
      expect(error.requestId).toBe('req-ratelimit')
      expect(error.retryAfter).toBe(60)
    })

    it('should have name set to "RateLimitError"', () => {
      const error = new RateLimitError('Test', 0)

      expect(error.name).toBe('RateLimitError')
    })

    it('should extend AlpacaError', () => {
      const error = new RateLimitError('Test', 0)

      expect(error).toBeInstanceOf(AlpacaError)
    })

    it('should work without retryAfter', () => {
      const error = new RateLimitError('Test', 0)

      expect(error.retryAfter).toBeUndefined()
    })

    it('should include retryAfter in toApiError()', () => {
      const error = new RateLimitError('Test', 0, undefined, 120)
      const apiError = error.toApiError()

      expect(apiError.type).toBe('rate_limit')
      expect(apiError.retryAfter).toBe(120)
    })
  })

  describe('InsufficientFundsError', () => {
    it('should create error with status 403 and correct type', () => {
      const error = new InsufficientFundsError('Insufficient buying power', 40350)

      expect(error.message).toBe('Insufficient buying power')
      expect(error.type).toBe('insufficient_funds')
      expect(error.code).toBe(40350)
      expect(error.status).toBe(403)
    })

    it('should have name set to "InsufficientFundsError"', () => {
      const error = new InsufficientFundsError('Test', 0)

      expect(error.name).toBe('InsufficientFundsError')
    })

    it('should extend AlpacaError', () => {
      const error = new InsufficientFundsError('Test', 0)

      expect(error).toBeInstanceOf(AlpacaError)
    })
  })

  describe('MarketClosedError', () => {
    it('should create error with status 403 and correct type', () => {
      const error = new MarketClosedError('Market is closed', 40360)

      expect(error.message).toBe('Market is closed')
      expect(error.type).toBe('market_closed')
      expect(error.code).toBe(40360)
      expect(error.status).toBe(403)
    })

    it('should have name set to "MarketClosedError"', () => {
      const error = new MarketClosedError('Test', 0)

      expect(error.name).toBe('MarketClosedError')
    })

    it('should extend AlpacaError', () => {
      const error = new MarketClosedError('Test', 0)

      expect(error).toBeInstanceOf(AlpacaError)
    })
  })

  describe('ServerError', () => {
    it('should create error with custom status >= 500 and correct type', () => {
      const error = new ServerError('Internal server error', 50000, 500)

      expect(error.message).toBe('Internal server error')
      expect(error.type).toBe('server')
      expect(error.code).toBe(50000)
      expect(error.status).toBe(500)
    })

    it('should support different 5xx status codes', () => {
      const error502 = new ServerError('Bad gateway', 0, 502)
      const error503 = new ServerError('Service unavailable', 0, 503)

      expect(error502.status).toBe(502)
      expect(error503.status).toBe(503)
    })

    it('should have name set to "ServerError"', () => {
      const error = new ServerError('Test', 0, 500)

      expect(error.name).toBe('ServerError')
    })

    it('should extend AlpacaError', () => {
      const error = new ServerError('Test', 0, 500)

      expect(error).toBeInstanceOf(AlpacaError)
    })
  })

  describe('createAlpacaError', () => {
    it('should return AuthenticationError for status 401', () => {
      const error = createAlpacaError('Unauthorized', 40100, 401, 'req-1')

      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.type).toBe('authentication')
      expect(error.status).toBe(401)
    })

    it('should return ForbiddenError for status 403', () => {
      const error = createAlpacaError('Forbidden', 40300, 403, 'req-2')

      expect(error).toBeInstanceOf(ForbiddenError)
      expect(error.type).toBe('forbidden')
      expect(error.status).toBe(403)
    })

    it('should return NotFoundError for status 404', () => {
      const error = createAlpacaError('Not found', 40400, 404, 'req-3')

      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.type).toBe('not_found')
      expect(error.status).toBe(404)
    })

    it('should return ValidationError for status 422', () => {
      const error = createAlpacaError('Invalid data', 42200, 422, 'req-4')

      expect(error).toBeInstanceOf(ValidationError)
      expect(error.type).toBe('validation')
      expect(error.status).toBe(422)
    })

    it('should return RateLimitError for status 429 with retryAfter', () => {
      const error = createAlpacaError('Rate limited', 42900, 429, 'req-5', 120)

      expect(error).toBeInstanceOf(RateLimitError)
      expect(error.type).toBe('rate_limit')
      expect(error.status).toBe(429)
      expect((error as RateLimitError).retryAfter).toBe(120)
    })

    it('should return ServerError for status 500', () => {
      const error = createAlpacaError('Server error', 50000, 500, 'req-6')

      expect(error).toBeInstanceOf(ServerError)
      expect(error.type).toBe('server')
      expect(error.status).toBe(500)
    })

    it('should return ServerError for status 502', () => {
      const error = createAlpacaError('Bad gateway', 50200, 502)

      expect(error).toBeInstanceOf(ServerError)
      expect(error.status).toBe(502)
    })

    it('should return ServerError for status 503', () => {
      const error = createAlpacaError('Service unavailable', 50300, 503)

      expect(error).toBeInstanceOf(ServerError)
      expect(error.status).toBe(503)
    })

    it('should return generic AlpacaError for unknown status codes', () => {
      const error = createAlpacaError('Bad request', 40000, 400)

      expect(error).toBeInstanceOf(AlpacaError)
      expect(error.constructor).toBe(AlpacaError)
      expect(error.type).toBe('unknown')
      expect(error.status).toBe(400)
    })

    it('should return InsufficientFundsError for 403 with "insufficient" in message', () => {
      const error = createAlpacaError('Insufficient buying power for this order', 40350, 403)

      expect(error).toBeInstanceOf(InsufficientFundsError)
      expect(error.name).toBe('InsufficientFundsError')
      expect(error.type).toBe('insufficient_funds')
    })

    it('should return InsufficientFundsError for 403 with "INSUFFICIENT" in message (case insensitive)', () => {
      const error = createAlpacaError('INSUFFICIENT FUNDS', 40350, 403)

      expect(error).toBeInstanceOf(InsufficientFundsError)
    })

    it('should return MarketClosedError for 403 with "market" and "closed" in message', () => {
      const error = createAlpacaError('The market is currently closed', 40360, 403)

      expect(error).toBeInstanceOf(MarketClosedError)
      expect(error.name).toBe('MarketClosedError')
      expect(error.type).toBe('market_closed')
    })

    it('should return MarketClosedError for 403 with "MARKET CLOSED" in message (case insensitive)', () => {
      const error = createAlpacaError('MARKET CLOSED for today', 40360, 403)

      expect(error).toBeInstanceOf(MarketClosedError)
    })

    it('should return ForbiddenError for 403 without special keywords', () => {
      const error = createAlpacaError('Access denied to this resource', 40300, 403)

      expect(error).toBeInstanceOf(ForbiddenError)
      expect(error).not.toBeInstanceOf(InsufficientFundsError)
      expect(error).not.toBeInstanceOf(MarketClosedError)
    })

    it('should prioritize InsufficientFundsError over MarketClosedError when both keywords present', () => {
      // Based on the code logic, insufficient is checked first
      const error = createAlpacaError('Insufficient funds, market closed', 40350, 403)

      expect(error).toBeInstanceOf(InsufficientFundsError)
    })
  })

  describe('createApiError', () => {
    it('should create AuthenticationApiError for status 401', () => {
      const error = createApiError('Unauthorized', 40100, 401, 'req-1')

      expect(error.type).toBe('authentication')
      expect(error.message).toBe('Unauthorized')
      expect(error.code).toBe(40100)
      expect(error.status).toBe(401)
      expect(error.requestId).toBe('req-1')
    })

    it('should create ForbiddenApiError for status 403', () => {
      const error = createApiError('Forbidden', 40300, 403)

      expect(error.type).toBe('forbidden')
      expect(error.status).toBe(403)
    })

    it('should create NotFoundApiError for status 404', () => {
      const error = createApiError('Not found', 40400, 404)

      expect(error.type).toBe('not_found')
      expect(error.status).toBe(404)
    })

    it('should create ValidationApiError for status 422', () => {
      const error = createApiError('Invalid', 42200, 422)

      expect(error.type).toBe('validation')
      expect(error.status).toBe(422)
    })

    it('should create RateLimitApiError for status 429 with retryAfter', () => {
      const error = createApiError('Rate limited', 42900, 429, 'req-1', 60)

      expect(error.type).toBe('rate_limit')
      expect(error.status).toBe(429)
      if (error.type === 'rate_limit') {
        expect(error.retryAfter).toBe(60)
      }
    })

    it('should create ServerApiError for status 500+', () => {
      const error = createApiError('Server error', 50000, 500)

      expect(error.type).toBe('server')
      expect(error.status).toBe(500)
    })

    it('should create InsufficientFundsApiError for 403 with "insufficient" in message', () => {
      const error = createApiError('Insufficient buying power', 40350, 403)

      expect(error.type).toBe('insufficient_funds')
      expect(error.status).toBe(403)
    })

    it('should create MarketClosedApiError for 403 with "market" and "closed" in message', () => {
      const error = createApiError('Market is closed', 40360, 403)

      expect(error.type).toBe('market_closed')
      expect(error.status).toBe(403)
    })

    it('should create UnknownApiError for other status codes', () => {
      const error = createApiError('Bad request', 40000, 400)

      expect(error.type).toBe('unknown')
      expect(error.status).toBe(400)
    })
  })

  describe('toApiError', () => {
    it('should convert AlpacaError to ApiError', () => {
      const alpacaError = new AlpacaError('Test', ErrorType.Unknown, 100, 400, 'req-1')
      const apiError = toApiError(alpacaError)

      expect(apiError.type).toBe('unknown')
      expect(apiError.message).toBe('Test')
      expect(apiError.code).toBe(100)
      expect(apiError.status).toBe(400)
      expect(apiError.requestId).toBe('req-1')
    })

    it('should convert AuthenticationError to ApiError', () => {
      const alpacaError = new AuthenticationError('Auth failed', 40100, 'req-2')
      const apiError = toApiError(alpacaError)

      expect(apiError.type).toBe('authentication')
      expect(apiError.status).toBe(401)
    })

    it('should convert RateLimitError to ApiError with retryAfter', () => {
      const alpacaError = new RateLimitError('Rate limited', 42900, 'req-3', 120)
      const apiError = toApiError(alpacaError)

      expect(apiError.type).toBe('rate_limit')
      if (apiError.type === 'rate_limit') {
        expect(apiError.retryAfter).toBe(120)
      }
    })

    it('should convert plain error-like objects to ApiError', () => {
      const obj = {
        message: 'Object error',
        code: 123,
        status: 500,
        requestId: 'req-4',
      }
      const apiError = toApiError(obj)

      expect(apiError.type).toBe('server')
      expect(apiError.message).toBe('Object error')
      expect(apiError.code).toBe(123)
      expect(apiError.status).toBe(500)
    })

    it('should handle objects with missing properties', () => {
      const obj = { message: 'Partial error' }
      const apiError = toApiError(obj)

      expect(apiError.type).toBe('unknown')
      expect(apiError.message).toBe('Partial error')
      expect(apiError.code).toBe(0)
      expect(apiError.status).toBe(0)
    })

    it('should convert Error instances to ApiError', () => {
      const error = new Error('Plain error')
      const apiError = toApiError(error)

      expect(apiError.type).toBe('unknown')
      expect(apiError.message).toBe('Plain error')
    })

    it('should convert non-Error values to ApiError', () => {
      const apiError = toApiError('string error')

      expect(apiError.type).toBe('unknown')
      expect(apiError.message).toBe('string error')
    })

    it('should handle null/undefined', () => {
      expect(toApiError(null).type).toBe('unknown')
      expect(toApiError(undefined).type).toBe('unknown')
    })
  })

  describe('Result type and helpers', () => {
    it('should create success result with ok()', () => {
      const result = ok({ id: 1, name: 'test' })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual({ id: 1, name: 'test' })
        expect(result.error).toBeUndefined()
      }
    })

    it('should create error result with err()', () => {
      const apiError: ApiError = {
        type: 'not_found',
        message: 'Not found',
        code: 40400,
        status: 404,
      }
      const result = err(apiError)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toEqual(apiError)
        expect(result.data).toBeUndefined()
      }
    })

    it('should work with type narrowing', () => {
      function getValue(): Result<number> {
        return ok(42)
      }

      const result = getValue()
      if (result.ok) {
        // TypeScript should know result.data is number
        const value: number = result.data
        expect(value).toBe(42)
      } else {
        // TypeScript should know result.error is ApiError
        const errorType: string = result.error.type
        expect(errorType).toBeDefined()
      }
    })

    it('should work with error type narrowing', () => {
      function getError(): Result<string> {
        return err({
          type: 'rate_limit',
          message: 'Rate limited',
          code: 42900,
          status: 429,
          retryAfter: 60,
        })
      }

      const result = getError()
      if (!result.ok && result.error.type === 'rate_limit') {
        // TypeScript should know result.error is RateLimitApiError
        expect(result.error.retryAfter).toBe(60)
      }
    })
  })

  describe('isApiError type guard', () => {
    it('should return true for valid ApiError objects', () => {
      const apiError: ApiError = {
        type: 'authentication',
        message: 'Auth failed',
        code: 40100,
        status: 401,
      }
      expect(isApiError(apiError)).toBe(true)
    })

    it('should return false for non-ApiError objects', () => {
      expect(isApiError({ message: 'error' })).toBe(false)
      expect(isApiError({ type: 'auth' })).toBe(false)
      expect(isApiError(null)).toBe(false)
      expect(isApiError(undefined)).toBe(false)
      expect(isApiError('string')).toBe(false)
      expect(isApiError(123)).toBe(false)
    })
  })

  describe('specific type guards', () => {
    const authError: ApiError = {
      type: 'authentication',
      message: 'Auth failed',
      code: 40100,
      status: 401,
    }
    const rateLimitError: ApiError = {
      type: 'rate_limit',
      message: 'Rate limited',
      code: 42900,
      status: 429,
      retryAfter: 60,
    }
    const notFoundError: ApiError = {
      type: 'not_found',
      message: 'Not found',
      code: 40400,
      status: 404,
    }
    const validationError: ApiError = {
      type: 'validation',
      message: 'Invalid',
      code: 42200,
      status: 422,
    }
    const insufficientFundsError: ApiError = {
      type: 'insufficient_funds',
      message: 'Insufficient funds',
      code: 40350,
      status: 403,
    }
    const marketClosedError: ApiError = {
      type: 'market_closed',
      message: 'Market closed',
      code: 40360,
      status: 403,
    }
    const serverError: ApiError = {
      type: 'server',
      message: 'Server error',
      code: 50000,
      status: 500,
    }

    it('isAuthenticationError should correctly identify authentication errors', () => {
      expect(isAuthenticationError(authError)).toBe(true)
      expect(isAuthenticationError(rateLimitError)).toBe(false)
      expect(isAuthenticationError(notFoundError)).toBe(false)
    })

    it('isRateLimitError should correctly identify rate limit errors', () => {
      expect(isRateLimitError(rateLimitError)).toBe(true)
      expect(isRateLimitError(authError)).toBe(false)
    })

    it('isNotFoundError should correctly identify not found errors', () => {
      expect(isNotFoundError(notFoundError)).toBe(true)
      expect(isNotFoundError(authError)).toBe(false)
    })

    it('isValidationError should correctly identify validation errors', () => {
      expect(isValidationError(validationError)).toBe(true)
      expect(isValidationError(authError)).toBe(false)
    })

    it('isInsufficientFundsError should correctly identify insufficient funds errors', () => {
      expect(isInsufficientFundsError(insufficientFundsError)).toBe(true)
      expect(isInsufficientFundsError(authError)).toBe(false)
    })

    it('isMarketClosedError should correctly identify market closed errors', () => {
      expect(isMarketClosedError(marketClosedError)).toBe(true)
      expect(isMarketClosedError(authError)).toBe(false)
    })

    it('isServerError should correctly identify server errors', () => {
      expect(isServerError(serverError)).toBe(true)
      expect(isServerError(authError)).toBe(false)
    })

    it('type guards should work for error narrowing', () => {
      function handleError(error: ApiError): string {
        if (isRateLimitError(error)) {
          // TypeScript should know error.retryAfter exists
          return `Retry after ${String(error.retryAfter ?? 'unknown')} seconds`
        }
        if (isAuthenticationError(error)) {
          return 'Please re-authenticate'
        }
        return 'Unknown error'
      }

      expect(handleError(rateLimitError)).toBe('Retry after 60 seconds')
      expect(handleError(authError)).toBe('Please re-authenticate')
      expect(handleError(serverError)).toBe('Unknown error')
    })
  })
})
