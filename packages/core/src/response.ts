/**
 * Response unwrap helpers for openapi-fetch responses
 *
 * These helpers provide type-safe error handling by:
 * 1. Converting openapi-fetch errors to AlpacaError instances
 * 2. Extracting request metadata (requestId, retryAfter) from headers
 * 3. Throwing explicit errors for unexpected null data
 */

import { createAlpacaError, AlpacaError } from './errors'

/**
 * Response shape from openapi-fetch
 */
export interface OpenApiFetchResponse<T> {
  data?: T
  error?: unknown
  response: Response
}

/**
 * Error object shape from Alpaca API
 */
interface AlpacaApiErrorBody {
  message?: string
  code?: number
}

/**
 * Creates an AlpacaError from an openapi-fetch error response
 */
function createAlpacaErrorFromResponse(
  error: unknown,
  response: Response
): AlpacaError {
  const requestId = response.headers.get('x-request-id') ?? undefined
  const retryAfterHeader = response.headers.get('retry-after')
  const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined

  // Extract error details from the error object
  const errorObj = error as AlpacaApiErrorBody
  const message = errorObj?.message ?? 'Unknown API error'
  const code = errorObj?.code ?? 0
  const status = response.status

  return createAlpacaError(message, code, status, requestId, retryAfter)
}

/**
 * Unwraps an openapi-fetch response, converting errors to AlpacaError.
 *
 * Use this for endpoints that return a single object.
 * Throws if data is null/undefined (unexpected empty response).
 *
 * @example
 * ```typescript
 * const result = await client.GET('/v2/account', { signal })
 * return unwrap(result)
 * ```
 */
export function unwrap<T>(result: OpenApiFetchResponse<T>): T {
  if (result.error) {
    throw createAlpacaErrorFromResponse(result.error, result.response)
  }

  if (result.data === undefined || result.data === null) {
    throw new AlpacaError(
      'Unexpected empty response from API',
      'unknown',
      0,
      result.response.status
    )
  }

  return result.data
}

/**
 * Unwraps an openapi-fetch response for list endpoints.
 *
 * Returns empty array if data is null/undefined (common for empty results).
 * This is intentional - list endpoints often return null for empty results.
 *
 * @example
 * ```typescript
 * const result = await client.GET('/v2/orders', { params: { query: params } })
 * return unwrapList(result)
 * ```
 */
export function unwrapList<T>(result: OpenApiFetchResponse<T[] | null>): T[] {
  if (result.error) {
    throw createAlpacaErrorFromResponse(result.error, result.response)
  }

  return result.data ?? []
}

/**
 * Unwraps an openapi-fetch response, allowing undefined data.
 *
 * Use this for endpoints where null/undefined is a valid response
 * (e.g., optional resources, 204 No Content).
 *
 * @example
 * ```typescript
 * const result = await client.GET('/v2/optional-resource', { signal })
 * return unwrapOptional(result) // T | undefined
 * ```
 */
export function unwrapOptional<T>(
  result: OpenApiFetchResponse<T>
): T | undefined {
  if (result.error) {
    throw createAlpacaErrorFromResponse(result.error, result.response)
  }

  return result.data
}
