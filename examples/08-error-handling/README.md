# Example 08 - Error Handling

This example demonstrates the **two error handling patterns** provided by the Alpaca SDK, plus a generic catch-all approach. Understanding these patterns is essential for building robust trading applications that gracefully handle API failures.

## Two Error Handling Patterns

The SDK provides two complementary approaches to error handling. You can choose whichever fits your coding style, or mix them in different parts of your application.

### Pattern 1: Class-based (instanceof)

Use `try/catch` with `instanceof` checks against specific error classes. This is the more traditional approach and works well with TypeScript's type narrowing.

**Error classes available:**

- `AuthenticationError` -- Invalid or missing API credentials (HTTP 401)
- `NotFoundError` -- Resource does not exist (HTTP 404)
- `ValidationError` -- Invalid request parameters (HTTP 422)
- `RateLimitError` -- Too many requests; has a `retryAfter` property (HTTP 429)
- `ForbiddenError` -- Insufficient permissions (HTTP 403)
- `InsufficientFundsError` -- Not enough buying power (HTTP 403)
- `MarketClosedError` -- Market is not open for trading (HTTP 403)
- `ServerError` -- Alpaca server error (HTTP 500+)
- `AlpacaError` -- Base class for all SDK errors

### Pattern 2: Discriminated Unions (type guards)

Convert caught errors to an `ApiError` discriminated union using `.toApiError()`, then use type guard functions or switch on the `.type` field. This is a more functional approach that works well with exhaustive switch statements.

**Type guards available:**

- `isAuthenticationError()`
- `isNotFoundError()`
- `isValidationError()`
- `isRateLimitError()`
- `isInsufficientFundsError()`
- `isMarketClosedError()`
- `isServerError()`

## Prerequisites

1. An [Alpaca](https://alpaca.markets/) brokerage account (free to sign up)
2. API keys generated from the Alpaca dashboard (use paper trading keys)
3. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed (`npm install -g tsx`)

## How to Run

```bash
ALPACA_KEY_ID=your-key-id ALPACA_SECRET_KEY=your-secret-key npx tsx examples/08-error-handling/index.ts
```

## What You Will See

The script intentionally triggers errors (like requesting a non-existent order) and demonstrates how to catch and inspect them using both patterns. You will see detailed error information including the error type, message, HTTP status code, and request ID.
