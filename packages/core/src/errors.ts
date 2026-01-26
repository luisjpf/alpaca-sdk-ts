/**
 * Typed error system for Alpaca SDK
 * Supports both class-based (instanceof) and discriminated union patterns
 */

// =============================================================================
// Error Type Constants (as const for type safety)
// =============================================================================

export const ErrorType = {
  Authentication: 'authentication',
  Forbidden: 'forbidden',
  NotFound: 'not_found',
  Validation: 'validation',
  RateLimit: 'rate_limit',
  InsufficientFunds: 'insufficient_funds',
  MarketClosed: 'market_closed',
  Server: 'server',
  Unknown: 'unknown',
} as const

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType]

// =============================================================================
// Discriminated Union Error Types (for Result pattern)
// =============================================================================

interface BaseApiError {
  message: string
  code: number
  status: number
  requestId?: string
}

export interface AuthenticationApiError extends BaseApiError {
  type: typeof ErrorType.Authentication
  status: 401
}

export interface ForbiddenApiError extends BaseApiError {
  type: typeof ErrorType.Forbidden
  status: 403
}

export interface NotFoundApiError extends BaseApiError {
  type: typeof ErrorType.NotFound
  status: 404
}

export interface ValidationApiError extends BaseApiError {
  type: typeof ErrorType.Validation
  status: 422
}

export interface RateLimitApiError extends BaseApiError {
  type: typeof ErrorType.RateLimit
  status: 429
  retryAfter?: number
}

export interface InsufficientFundsApiError extends BaseApiError {
  type: typeof ErrorType.InsufficientFunds
  status: 403
}

export interface MarketClosedApiError extends BaseApiError {
  type: typeof ErrorType.MarketClosed
  status: 403
}

export interface ServerApiError extends BaseApiError {
  type: typeof ErrorType.Server
  status: number // 500+
}

export interface UnknownApiError extends BaseApiError {
  type: typeof ErrorType.Unknown
}

/** Discriminated union of all API error types */
export type ApiError =
  | AuthenticationApiError
  | ForbiddenApiError
  | NotFoundApiError
  | ValidationApiError
  | RateLimitApiError
  | InsufficientFundsApiError
  | MarketClosedApiError
  | ServerApiError
  | UnknownApiError

// =============================================================================
// Result Type (for compile-time error handling)
// =============================================================================

export type Result<T, E = ApiError> =
  | { ok: true; data: T; error?: never }
  | { ok: false; data?: never; error: E }

/** Create a success result */
export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data }
}

/** Create an error result */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}

// =============================================================================
// Error Classes (for instanceof pattern)
// =============================================================================

/** Base error class for all Alpaca errors */
export class AlpacaError extends Error {
  readonly type: ErrorType
  readonly code: number
  readonly status: number
  readonly requestId?: string

  constructor(
    message: string,
    type: ErrorType,
    code: number,
    status: number,
    requestId?: string
  ) {
    super(message)
    this.name = 'AlpacaError'
    this.type = type
    this.code = code
    this.status = status
    this.requestId = requestId
    Object.setPrototypeOf(this, AlpacaError.prototype)
  }

  /** Convert to plain error object (for Result pattern) */
  toApiError(): ApiError {
    return {
      type: this.type,
      message: this.message,
      code: this.code,
      status: this.status,
      requestId: this.requestId,
    } as ApiError
  }
}

/** Authentication failed (401) */
export class AuthenticationError extends AlpacaError {
  declare readonly type: typeof ErrorType.Authentication
  declare readonly status: 401

  constructor(message: string, code: number, requestId?: string) {
    super(message, ErrorType.Authentication, code, 401, requestId)
    this.name = 'AuthenticationError'
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

/** Forbidden - insufficient permissions (403) */
export class ForbiddenError extends AlpacaError {
  declare readonly type: typeof ErrorType.Forbidden
  declare readonly status: 403

  constructor(message: string, code: number, requestId?: string) {
    super(message, ErrorType.Forbidden, code, 403, requestId)
    this.name = 'ForbiddenError'
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

/** Resource not found (404) */
export class NotFoundError extends AlpacaError {
  declare readonly type: typeof ErrorType.NotFound
  declare readonly status: 404

  constructor(message: string, code: number, requestId?: string) {
    super(message, ErrorType.NotFound, code, 404, requestId)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

/** Validation error (422) */
export class ValidationError extends AlpacaError {
  declare readonly type: typeof ErrorType.Validation
  declare readonly status: 422

  constructor(message: string, code: number, requestId?: string) {
    super(message, ErrorType.Validation, code, 422, requestId)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/** Rate limit exceeded (429) */
export class RateLimitError extends AlpacaError {
  declare readonly type: typeof ErrorType.RateLimit
  declare readonly status: 429
  readonly retryAfter?: number

  constructor(message: string, code: number, requestId?: string, retryAfter?: number) {
    super(message, ErrorType.RateLimit, code, 429, requestId)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }

  override toApiError(): RateLimitApiError {
    return {
      type: ErrorType.RateLimit,
      message: this.message,
      code: this.code,
      status: 429,
      requestId: this.requestId,
      retryAfter: this.retryAfter,
    }
  }
}

/** Insufficient buying power */
export class InsufficientFundsError extends AlpacaError {
  declare readonly type: typeof ErrorType.InsufficientFunds
  declare readonly status: 403

  constructor(message: string, code: number, requestId?: string) {
    super(message, ErrorType.InsufficientFunds, code, 403, requestId)
    this.name = 'InsufficientFundsError'
    Object.setPrototypeOf(this, InsufficientFundsError.prototype)
  }
}

/** Market is closed */
export class MarketClosedError extends AlpacaError {
  declare readonly type: typeof ErrorType.MarketClosed
  declare readonly status: 403

  constructor(message: string, code: number, requestId?: string) {
    super(message, ErrorType.MarketClosed, code, 403, requestId)
    this.name = 'MarketClosedError'
    Object.setPrototypeOf(this, MarketClosedError.prototype)
  }
}

/** Internal server error (500+) */
export class ServerError extends AlpacaError {
  declare readonly type: typeof ErrorType.Server

  constructor(message: string, code: number, status: number, requestId?: string) {
    super(message, ErrorType.Server, code, status, requestId)
    this.name = 'ServerError'
    Object.setPrototypeOf(this, ServerError.prototype)
  }
}

// =============================================================================
// Error Factory Functions
// =============================================================================

/**
 * Create appropriate error class instance from API response
 */
export function createAlpacaError(
  message: string,
  code: number,
  status: number,
  requestId?: string,
  retryAfter?: number
): AlpacaError {
  switch (status) {
    case 401:
      return new AuthenticationError(message, code, requestId)
    case 403:
      if (message.toLowerCase().includes('insufficient')) {
        return new InsufficientFundsError(message, code, requestId)
      }
      if (message.toLowerCase().includes('market') && message.toLowerCase().includes('closed')) {
        return new MarketClosedError(message, code, requestId)
      }
      return new ForbiddenError(message, code, requestId)
    case 404:
      return new NotFoundError(message, code, requestId)
    case 422:
      return new ValidationError(message, code, requestId)
    case 429:
      return new RateLimitError(message, code, requestId, retryAfter)
    default:
      if (status >= 500) {
        return new ServerError(message, code, status, requestId)
      }
      return new AlpacaError(message, ErrorType.Unknown, code, status, requestId)
  }
}

/**
 * Create typed ApiError object from raw API response (for Result pattern)
 */
export function createApiError(
  message: string,
  code: number,
  status: number,
  requestId?: string,
  retryAfter?: number
): ApiError {
  switch (status) {
    case 401:
      return { type: ErrorType.Authentication, message, code, status: 401, requestId }
    case 403:
      if (message.toLowerCase().includes('insufficient')) {
        return { type: ErrorType.InsufficientFunds, message, code, status: 403, requestId }
      }
      if (message.toLowerCase().includes('market') && message.toLowerCase().includes('closed')) {
        return { type: ErrorType.MarketClosed, message, code, status: 403, requestId }
      }
      return { type: ErrorType.Forbidden, message, code, status: 403, requestId }
    case 404:
      return { type: ErrorType.NotFound, message, code, status: 404, requestId }
    case 422:
      return { type: ErrorType.Validation, message, code, status: 422, requestId }
    case 429:
      return { type: ErrorType.RateLimit, message, code, status: 429, requestId, retryAfter }
    default:
      if (status >= 500) {
        return { type: ErrorType.Server, message, code, status, requestId }
      }
      return { type: ErrorType.Unknown, message, code, status, requestId }
  }
}

/**
 * Convert unknown error to typed ApiError
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof AlpacaError) {
    return error.toApiError()
  }

  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>
    const message = typeof e.message === 'string' ? e.message : 'Unknown error'
    const code = typeof e.code === 'number' ? e.code : 0
    const status = typeof e.status === 'number' ? e.status : 0
    const requestId = typeof e.requestId === 'string' ? e.requestId : undefined
    const retryAfter = typeof e.retryAfter === 'number' ? e.retryAfter : undefined

    return createApiError(message, code, status, requestId, retryAfter)
  }

  return {
    type: ErrorType.Unknown,
    message: error instanceof Error ? error.message : String(error),
    code: 0,
    status: 0,
  }
}

/**
 * Type guard to check if a value is an ApiError
 */
export function isApiError(value: unknown): value is ApiError {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    'message' in value &&
    'code' in value &&
    'status' in value
  )
}

/**
 * Type guards for specific error types
 */
export const isAuthenticationError = (e: ApiError): e is AuthenticationApiError =>
  e.type === ErrorType.Authentication

export const isRateLimitError = (e: ApiError): e is RateLimitApiError =>
  e.type === ErrorType.RateLimit

export const isNotFoundError = (e: ApiError): e is NotFoundApiError =>
  e.type === ErrorType.NotFound

export const isValidationError = (e: ApiError): e is ValidationApiError =>
  e.type === ErrorType.Validation

export const isInsufficientFundsError = (e: ApiError): e is InsufficientFundsApiError =>
  e.type === ErrorType.InsufficientFunds

export const isMarketClosedError = (e: ApiError): e is MarketClosedApiError =>
  e.type === ErrorType.MarketClosed

export const isServerError = (e: ApiError): e is ServerApiError =>
  e.type === ErrorType.Server
