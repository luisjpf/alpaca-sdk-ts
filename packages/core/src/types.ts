/**
 * Core configuration types for Alpaca SDK
 */

/** Environment for Alpaca API */
export type AlpacaEnvironment = 'paper' | 'live'

/** Base configuration for all Alpaca clients */
export interface AlpacaConfig {
  /** API Key ID */
  keyId: string
  /** API Secret Key */
  secretKey: string
  /** Use paper trading environment (default: true) */
  paper?: boolean
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Maximum number of retries for failed requests (default: 2) */
  maxRetries?: number
  /** Custom base URL override */
  baseUrl?: string
}

/** Configuration resolved with defaults */
export interface ResolvedAlpacaConfig {
  keyId: string
  secretKey: string
  paper: boolean
  timeout: number
  maxRetries: number
  baseUrl: string
}

/** API response wrapper */
export type AlpacaResult<T> =
  | { data: T; error: null }
  | { data: null; error: AlpacaErrorResponse }

/** Error response from Alpaca API */
export interface AlpacaErrorResponse {
  code: number
  message: string
  status: number
  requestId?: string
}

/** Request options for individual API calls */
export interface RequestOptions {
  /** Custom timeout for this request */
  timeout?: number
  /** Idempotency key for POST/PATCH requests */
  idempotencyKey?: string
  /** AbortSignal for request cancellation */
  signal?: AbortSignal
}
