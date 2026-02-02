# Error Handling

## Overview

The SDK provides two complementary error patterns:

1. **Class-based errors** -- use `instanceof` for try/catch flows
2. **Discriminated unions** -- use `type` field for pattern matching

Both patterns carry the same information. Choose whichever fits your codebase. See [Example 08](../examples/08-error-handling/) for a runnable demonstration of both patterns.

## Class-Based Errors

All errors extend the `AlpacaError` base class.

### Error Classes

| Class                    | Status | Type                 |
| ------------------------ | ------ | -------------------- |
| `AuthenticationError`    | 401    | `authentication`     |
| `ForbiddenError`         | 403    | `forbidden`          |
| `InsufficientFundsError` | 403    | `insufficient_funds` |
| `MarketClosedError`      | 403    | `market_closed`      |
| `NotFoundError`          | 404    | `not_found`          |
| `ValidationError`        | 422    | `validation`         |
| `RateLimitError`         | 429    | `rate_limit`         |
| `ServerError`            | 500+   | `server`             |
| `NotImplementedError`    | 501    | `not_implemented`    |

### Error Properties

Every `AlpacaError` has these properties:

| Property    | Type                  | Description                                   |
| ----------- | --------------------- | --------------------------------------------- |
| `message`   | `string`              | Human-readable error message                  |
| `code`      | `number`              | Alpaca-specific error code                    |
| `status`    | `number`              | HTTP status code                              |
| `requestId` | `string \| undefined` | Request ID from `x-request-id` header         |
| `type`      | `ErrorType`           | Discriminant string (e.g. `'authentication'`) |

`RateLimitError` also has:

| Property     | Type                  | Description                     |
| ------------ | --------------------- | ------------------------------- |
| `retryAfter` | `number \| undefined` | Seconds to wait before retrying |

### Try/Catch Example

```ts
import {
  AuthenticationError,
  RateLimitError,
  InsufficientFundsError,
  ValidationError,
  AlpacaError,
} from '@luisjpf/alpaca-sdk'

try {
  await client.trading.orders.create({
    symbol: 'AAPL',
    qty: '10',
    side: 'buy',
    type: 'market',
    time_in_force: 'day',
  })
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Bad credentials')
  } else if (error instanceof InsufficientFundsError) {
    console.error('Not enough buying power')
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`)
  } else if (error instanceof ValidationError) {
    console.error(`Invalid request: ${error.message}`)
  } else if (error instanceof AlpacaError) {
    console.error(`API error ${error.status}: ${error.message}`)
    console.error(`Request ID: ${error.requestId}`)
  }
}
```

## Special 403 Handling

The SDK inspects the error message on 403 responses to return a more specific error class:

- Message contains **"insufficient"** --> `InsufficientFundsError`
- Message contains **"market"** AND **"closed"** --> `MarketClosedError`
- Otherwise --> `ForbiddenError`

## Discriminated Union Pattern

Convert any `AlpacaError` to a plain `ApiError` object using `.toApiError()`, then switch on the `type` field:

```ts
import { AlpacaError, type ApiError } from '@luisjpf/alpaca-sdk'

try {
  await client.trading.orders.create(orderRequest)
} catch (error) {
  if (error instanceof AlpacaError) {
    const apiError: ApiError = error.toApiError()

    switch (apiError.type) {
      case 'authentication':
        console.error('Bad credentials')
        break
      case 'insufficient_funds':
        console.error('Not enough buying power')
        break
      case 'rate_limit':
        console.error(`Retry after ${apiError.retryAfter}s`)
        break
      case 'validation':
        console.error(`Invalid: ${apiError.message}`)
        break
      case 'server':
        console.error('Server error, try again later')
        break
    }
  }
}
```

### Type Guards

The SDK exports type guard functions for narrowing `ApiError` types:

```ts
import {
  toApiError,
  isAuthenticationError,
  isRateLimitError,
  isNotFoundError,
  isValidationError,
  isInsufficientFundsError,
  isMarketClosedError,
  isServerError,
} from '@luisjpf/alpaca-sdk'

const apiError = toApiError(error)

if (isRateLimitError(apiError)) {
  console.log(`Retry after: ${apiError.retryAfter}`)
}
```

## Automatic Retries

The SDK automatically retries certain failed requests with exponential backoff.

### Retried Errors

| Status | Error                                          | Retried? |
| ------ | ---------------------------------------------- | -------- |
| 429    | Rate limit                                     | Yes      |
| 500+   | Server errors                                  | Yes      |
| 401    | Authentication                                 | No       |
| 403    | Forbidden / Insufficient funds / Market closed | No       |
| 404    | Not found                                      | No       |
| 422    | Validation                                     | No       |

### Backoff Strategy

- **Algorithm**: exponential backoff with jitter
- **Base delay**: 1 second
- **Max delay per attempt**: 30 seconds
- **Overall max backoff**: 5 minutes (prevents abuse via large `retry-after` headers)
- **429 responses**: uses the `retry-after` header when present (capped at 5 minutes)

### Configuration

```ts
const client = createAlpacaClient({
  keyId: 'your-key',
  secretKey: 'your-secret',
  maxRetries: 2, // default: 2 (total of 3 attempts)
})

// Disable retries entirely
const noRetry = createAlpacaClient({
  keyId: 'your-key',
  secretKey: 'your-secret',
  maxRetries: 0,
})
```

### Unknown Status Codes

Status codes not matching any specific class produce a generic `AlpacaError` with `type: 'unknown'`.

## Request ID

Every error includes a `requestId` pulled from the `x-request-id` response header. Include this when contacting Alpaca support:

```ts
try {
  await client.trading.account.get()
} catch (error) {
  if (error instanceof AlpacaError) {
    console.error(`Request ID: ${error.requestId}`)
  }
}
```
