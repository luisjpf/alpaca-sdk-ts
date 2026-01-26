# Alpaca SDK for TypeScript

[![CI](https://github.com/luisjpf/alpaca-sdk-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/luisjpf/alpaca-sdk-ts/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@luisjpf/alpaca-sdk.svg)](https://www.npmjs.com/package/@luisjpf/alpaca-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)

Modern, type-safe TypeScript SDK for Alpaca's Trading, Broker, and Market Data APIs.

## Features

- **Type-safe**: Auto-generated types from OpenAPI specs
- **Universal**: Works in Node.js 18+, Deno, Bun, browsers, and edge runtimes
- **Minimal**: Native `fetch`, zero HTTP dependencies
- **Tree-shakeable**: Import only what you need
- **WebSocket Streaming**: Real-time market data and trade updates
- **Modern**: ESM-first with CommonJS compatibility

## Installation

```bash
pnpm add @luisjpf/alpaca-sdk
```

## Quick Start

```typescript
import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

const alpaca = createAlpacaClient({
  keyId: process.env.ALPACA_KEY_ID!,
  secretKey: process.env.ALPACA_SECRET_KEY!,
  paper: true, // Use paper trading
})

// Get account info
const account = await alpaca.trading.account.get()

// Place an order
const order = await alpaca.trading.orders.create({
  symbol: 'AAPL',
  qty: '10',
  side: 'buy',
  type: 'market',
  time_in_force: 'day',
})

// Get market data
const bars = await alpaca.marketData.stocks.getSymbolBars('AAPL', {
  start: '2024-01-01',
  end: '2024-01-31',
  timeframe: '1Day',
})
```

## Configuration

```typescript
import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

const alpaca = createAlpacaClient({
  keyId: 'YOUR_API_KEY',
  secretKey: 'YOUR_SECRET_KEY',
  paper: true, // default: true
  timeout: 30_000, // default: 30s
  maxRetries: 2, // default: 2
})
```

## Error Handling

### Automatic Retries

The SDK automatically retries failed requests for:

- **429 Rate Limit** - Uses `retry-after` header or exponential backoff
- **500+ Server Errors** - Uses exponential backoff with jitter

```typescript
const alpaca = createAlpacaClient({
  keyId: 'YOUR_API_KEY',
  secretKey: 'YOUR_SECRET_KEY',
  maxRetries: 2, // default: 2 (set to 0 to disable)
  timeout: 30_000, // default: 30s
})
```

### Error Classes

All errors extend `AlpacaError` and can be caught with `instanceof`:

```typescript
import {
  AlpacaError,
  AuthenticationError,
  RateLimitError,
  InsufficientFundsError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  MarketClosedError,
  ServerError,
} from '@luisjpf/alpaca-sdk'

try {
  await client.orders.create({ ... })
} catch (error) {
  if (error instanceof RateLimitError) {
    // Auto-retried, but still failed after maxRetries
    console.log(`Rate limited. Retry after ${error.retryAfter}s`)
  } else if (error instanceof InsufficientFundsError) {
    console.log('Not enough buying power')
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API credentials')
  } else if (error instanceof ValidationError) {
    console.log('Invalid order parameters')
  } else if (error instanceof MarketClosedError) {
    console.log('Market is closed')
  } else if (error instanceof NotFoundError) {
    console.log('Resource not found')
  } else if (error instanceof AlpacaError) {
    // Base class for all Alpaca errors
    console.log(`Error ${error.code}: ${error.message}`)
  }
}
```

### Error Classes Reference

| Error Class              | Status | Description                        |
| ------------------------ | ------ | ---------------------------------- |
| `AuthenticationError`    | 401    | Invalid API credentials            |
| `ForbiddenError`         | 403    | Insufficient permissions           |
| `InsufficientFundsError` | 403    | Not enough buying power            |
| `MarketClosedError`      | 403    | Market is currently closed         |
| `NotFoundError`          | 404    | Resource not found                 |
| `ValidationError`        | 422    | Invalid request parameters         |
| `RateLimitError`         | 429    | Rate limit exceeded (auto-retried) |
| `ServerError`            | 500+   | Server error (auto-retried)        |

### Error Properties

All errors include:

```typescript
interface AlpacaError {
  message: string // Human-readable error message
  code: number // Alpaca error code
  status: number // HTTP status code
  requestId?: string // Request ID for support
}

// RateLimitError also includes:
interface RateLimitError extends AlpacaError {
  retryAfter?: number // Seconds until retry (from retry-after header)
}
```

### Type Guards

For type-safe error handling without `instanceof`:

```typescript
import {
  AlpacaError,
  isAuthenticationError,
  isRateLimitError,
  isInsufficientFundsError,
  isValidationError,
  isNotFoundError,
  isMarketClosedError,
  isServerError,
} from '@luisjpf/alpaca-sdk'

try {
  await client.orders.create({ ... })
} catch (error) {
  if (error instanceof AlpacaError) {
    const apiError = error.toApiError()

    if (isRateLimitError(apiError)) {
      console.log(`Retry after ${apiError.retryAfter}s`)
    } else if (isInsufficientFundsError(apiError)) {
      console.log('Not enough buying power')
    }
  }
}
```

## WebSocket Streaming

Real-time market data and trade updates via WebSocket.

### Stock Data Streaming

```typescript
import { createStockStream } from '@luisjpf/alpaca-sdk'

const stream = createStockStream({
  keyId: 'YOUR_API_KEY',
  secretKey: 'YOUR_SECRET_KEY',
  feed: 'iex', // 'iex' (free), 'sip' (paid), or 'delayed_sip'
})

// Register handlers
stream.onTrade((trade) => {
  console.log(`Trade: ${trade.S} @ $${trade.p}`)
})

stream.onQuote((quote) => {
  console.log(`Quote: ${quote.S} bid: $${quote.bp} ask: $${quote.ap}`)
})

stream.onBar((bar) => {
  console.log(`Bar: ${bar.S} O:${bar.o} H:${bar.h} L:${bar.l} C:${bar.c}`)
})

stream.onConnect(() => console.log('Connected!'))
stream.onError((err) => console.error('Error:', err))

// Connect and subscribe
stream.connect()
stream.subscribeForTrades(['AAPL', 'MSFT', 'GOOGL'])
stream.subscribeForQuotes(['AAPL'])
stream.subscribeForBars(['AAPL'])
```

### Crypto Data Streaming

```typescript
import { createCryptoStream } from '@luisjpf/alpaca-sdk'

const stream = createCryptoStream({
  keyId: 'YOUR_API_KEY',
  secretKey: 'YOUR_SECRET_KEY',
  location: 'us', // 'us' (Alpaca), 'us-1' (Kraken US), 'eu-1' (Kraken EU)
})

stream.onTrade((trade) => {
  console.log(`Crypto Trade: ${trade.S} @ $${trade.p}`)
})

stream.connect()
stream.subscribeForTrades(['BTC/USD', 'ETH/USD'])
```

### Trade Updates Streaming

```typescript
import { createTradeUpdatesStream } from '@luisjpf/alpaca-sdk'

const stream = createTradeUpdatesStream({
  keyId: 'YOUR_API_KEY',
  secretKey: 'YOUR_SECRET_KEY',
  paper: true, // true for paper trading, false for live
})

stream.onTradeUpdate((update) => {
  console.log(`Order ${update.event}: ${JSON.stringify(update.order)}`)
})

stream.connect()
stream.subscribe()
```

### Stock Feed Types

| Feed          | Description                   | Subscription      |
| ------------- | ----------------------------- | ----------------- |
| `iex`         | IEX Exchange data only        | Free (Basic plan) |
| `sip`         | Full consolidated market data | Algo Trader Plus  |
| `delayed_sip` | 15-minute delayed SIP data    | Free              |

### Crypto Locations

| Location | Exchange  | Notes                     |
| -------- | --------- | ------------------------- |
| `us`     | Alpaca    | Default, recommended      |
| `us-1`   | Kraken US | Available in 23 US states |
| `eu-1`   | Kraken EU | European markets          |

## Development

```bash
# Install dependencies
pnpm install

# Generate types from OpenAPI specs
pnpm generate:types

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Type check
pnpm typecheck
```

## Requirements

- Node.js >= 18.0.0 (for native `fetch`)
- pnpm >= 9.0.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
