/**
 * Example 08 - Error Handling
 *
 * The Alpaca SDK provides two complementary error handling patterns:
 *
 * 1. Class-based (instanceof) — Traditional try/catch with typed error classes
 * 2. Discriminated unions — Convert errors to plain objects with type guards
 *
 * Both patterns provide the same information; choose whichever fits your
 * coding style. This example demonstrates both, plus a generic catch-all.
 */

import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

// Import error CLASSES for Pattern 1 (instanceof checks).
// These are value imports because we need the actual class at runtime
// to use instanceof.
import {
  AlpacaError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
} from '@luisjpf/alpaca-sdk'

// Import type guard FUNCTIONS for Pattern 2 (discriminated unions).
// These are value imports because they are functions called at runtime.
import { isNotFoundError, isRateLimitError, isAuthenticationError } from '@luisjpf/alpaca-sdk'

// Import the ApiError type for type annotations (type-only import).
import type { ApiError } from '@luisjpf/alpaca-sdk'

async function main() {
  // ---------------------------------------------------------------------------
  // Setup: Create the Alpaca client
  // ---------------------------------------------------------------------------
  const keyId = process.env.ALPACA_KEY_ID
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!keyId || !secretKey) {
    console.error('Please set ALPACA_KEY_ID and ALPACA_SECRET_KEY environment variables')
    process.exit(1)
  }

  const alpaca = createAlpacaClient({ keyId, secretKey, paper: true })

  // =========================================================================
  // PATTERN 1: Class-based error handling with instanceof
  // =========================================================================
  //
  // This pattern uses traditional try/catch with instanceof checks against
  // specific error classes. TypeScript automatically narrows the type inside
  // each instanceof block, giving you access to class-specific properties.
  //
  // When to use this pattern:
  // - You're familiar with class-based error handling from other languages
  // - You want the simplest, most readable error handling code
  // - You need instanceof checks in catch blocks

  console.log('=== Pattern 1: Class-based (instanceof) ===')
  console.log()

  try {
    // Attempt to get an order that doesn't exist. We use a fake UUID that
    // is a valid UUID format but doesn't correspond to any real order.
    // This will throw a NotFoundError (HTTP 404).
    console.log('Attempting to get a non-existent order...')
    await alpaca.trading.orders.get('00000000-0000-0000-0000-000000000000')
  } catch (error) {
    // Check for specific error types from most specific to least specific.
    // This ordering matters because JavaScript checks instanceof in order,
    // and all SDK errors extend AlpacaError.

    if (error instanceof NotFoundError) {
      // NotFoundError (HTTP 404): The requested resource doesn't exist.
      // This is the most common error when looking up orders, positions,
      // or other resources by ID.
      console.log('Caught NotFoundError!')
      console.log(`  Message:    ${error.message}`)
      console.log(`  Status:     ${error.status}`) // 404
      console.log(`  Code:       ${error.code}`) // Alpaca-specific error code
      console.log(`  Type:       ${error.type}`) // 'not_found'
      console.log(`  Request ID: ${error.requestId}`) // Useful for Alpaca support tickets
    } else if (error instanceof AuthenticationError) {
      // AuthenticationError (HTTP 401): Invalid API credentials.
      // This happens when your key ID or secret key is wrong, expired,
      // or revoked. Check your Alpaca dashboard for valid keys.
      console.log('Caught AuthenticationError!')
      console.log(`  Message: ${error.message}`)
      console.log(`  Status:  ${error.status}`) // Always 401
    } else if (error instanceof ValidationError) {
      // ValidationError (HTTP 422): The request parameters are invalid.
      // For example, trying to create an order with a negative quantity
      // or an invalid time-in-force value.
      console.log('Caught ValidationError!')
      console.log(`  Message: ${error.message}`)
      console.log(`  Status:  ${error.status}`) // Always 422
    } else if (error instanceof RateLimitError) {
      // RateLimitError (HTTP 429): You've made too many API requests.
      // Alpaca rate limits vary by endpoint. The retryAfter property
      // tells you how many seconds to wait before retrying.
      console.log('Caught RateLimitError!')
      console.log(`  Message:     ${error.message}`)
      console.log(`  Status:      ${error.status}`) // Always 429
      console.log(`  Retry After: ${error.retryAfter}s`) // Seconds to wait
    } else if (error instanceof AlpacaError) {
      // AlpacaError is the base class for ALL SDK errors. Catching it
      // here acts as a catch-all for any Alpaca-specific error that
      // wasn't matched above (e.g., ForbiddenError, ServerError).
      console.log('Caught generic AlpacaError!')
      console.log(`  Type:    ${error.type}`)
      console.log(`  Message: ${error.message}`)
      console.log(`  Status:  ${error.status}`)
    } else {
      // Non-Alpaca errors (network failures, JSON parse errors, etc.)
      // These are standard JavaScript errors, not from the SDK.
      console.log('Caught unexpected error:', error)
    }
  }

  console.log()

  // =========================================================================
  // PATTERN 2: Discriminated unions with type guards
  // =========================================================================
  //
  // This pattern converts the caught error to an ApiError plain object using
  // .toApiError(), then uses type guard functions to narrow the type. This
  // is a more functional approach and works especially well with switch
  // statements for exhaustive error handling.
  //
  // When to use this pattern:
  // - You prefer functional programming patterns over class hierarchies
  // - You want to use switch statements with exhaustive type checking
  // - You're passing errors between functions or serializing them

  console.log('=== Pattern 2: Discriminated Unions (type guards) ===')
  console.log()

  try {
    // Same intentional error: requesting a non-existent order
    console.log('Attempting to get a non-existent order (again)...')
    await alpaca.trading.orders.get('00000000-0000-0000-0000-000000000000')
  } catch (error) {
    // First, verify this is an AlpacaError so we can safely call toApiError().
    // Non-Alpaca errors (like network errors) won't have this method.
    if (error instanceof AlpacaError) {
      // Convert the class-based error into a plain ApiError object.
      // The ApiError type is a discriminated union where the 'type' field
      // determines which specific error type it is.
      const apiError: ApiError = error.toApiError()

      // Approach A: Use type guard functions
      // These functions narrow the ApiError type and give you access
      // to type-specific properties (like retryAfter on RateLimitError).
      if (isNotFoundError(apiError)) {
        console.log('Type guard: isNotFoundError() matched!')
        console.log(`  Type:    ${apiError.type}`) // 'not_found'
        console.log(`  Message: ${apiError.message}`)
        console.log(`  Status:  ${apiError.status}`) // 404 (narrowed by type guard)
      } else if (isRateLimitError(apiError)) {
        console.log('Type guard: isRateLimitError() matched!')
        console.log(`  Retry After: ${apiError.retryAfter}s`) // Only on RateLimitApiError
      } else if (isAuthenticationError(apiError)) {
        console.log('Type guard: isAuthenticationError() matched!')
        console.log(`  Status: ${apiError.status}`) // 401 (narrowed)
      }

      console.log()

      // Approach B: Switch on the type field
      // This is useful when you want to handle every possible error type
      // in one place. TypeScript can check that all cases are covered
      // if you enable strict exhaustiveness checking.
      console.log('Switch on apiError.type:')
      switch (apiError.type) {
        case 'authentication':
          console.log('  -> Authentication error: Check your API keys')
          break
        case 'not_found':
          console.log('  -> Not found: The requested resource does not exist')
          break
        case 'validation':
          console.log('  -> Validation error: Check your request parameters')
          break
        case 'rate_limit':
          console.log('  -> Rate limited: Slow down your requests')
          break
        case 'insufficient_funds':
          console.log('  -> Insufficient funds: Not enough buying power')
          break
        case 'market_closed':
          console.log('  -> Market closed: Wait for market hours')
          break
        case 'forbidden':
          console.log('  -> Forbidden: You lack permission for this action')
          break
        case 'server':
          console.log('  -> Server error: Alpaca is having issues, try again later')
          break
        case 'unknown':
          console.log('  -> Unknown error: Something unexpected happened')
          break
      }
    }
  }

  console.log()

  // =========================================================================
  // PATTERN 3: Generic catch-all with AlpacaError base class
  // =========================================================================
  //
  // Sometimes you don't need to handle each error type individually. For
  // example, in a simple script you might just want to log the error and
  // move on. The AlpacaError base class gives you access to all the common
  // properties (message, status, code, type, requestId).
  //
  // When to use this pattern:
  // - You want simple, one-size-fits-all error logging
  // - You're building middleware that logs all errors uniformly
  // - You don't need type-specific behavior (like retryAfter)

  console.log('=== Pattern 3: Generic Catch-All ===')
  console.log()

  try {
    // Attempt to create an order with invalid parameters to trigger
    // a different type of error. An empty symbol is clearly invalid.
    console.log('Attempting to create an order with invalid parameters...')
    await alpaca.trading.orders.create({
      symbol: '', // Empty symbol will fail validation
      qty: '1',
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    })
  } catch (error) {
    // Catch ANY Alpaca error using the base class. This is the simplest
    // approach — you get all the common error properties without needing
    // to check for specific types.
    if (error instanceof AlpacaError) {
      console.log('Caught an AlpacaError (base class catch-all):')
      console.log(`  Name:       ${error.name}`) // e.g., 'ValidationError'
      console.log(`  Type:       ${error.type}`) // e.g., 'validation'
      console.log(`  Message:    ${error.message}`) // Human-readable description
      console.log(`  Status:     ${error.status}`) // HTTP status code
      console.log(`  Code:       ${error.code}`) // Alpaca-specific error code
      console.log(`  Request ID: ${error.requestId}`) // For support tickets

      // You can still check the type if needed, even from the base class
      console.log()
      console.log('  Even from base class, you can still branch:')
      if (error.type === 'validation') {
        console.log('  -> This was a validation error')
      } else if (error.type === 'not_found') {
        console.log('  -> This was a not-found error')
      } else {
        console.log(`  -> This was a '${error.type}' error`)
      }
    } else if (error instanceof Error) {
      // Non-Alpaca errors: network failures, DNS resolution issues,
      // timeouts, etc. These are standard JavaScript Error objects.
      console.log('Non-Alpaca error:', error.message)
    } else {
      // Unknown thrown values (strings, numbers, etc.)
      // This is rare but possible in JavaScript.
      console.log('Unknown error:', error)
    }
  }

  console.log()
  console.log('Error handling demonstration complete!')
}

main().catch(console.error)
