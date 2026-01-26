# Alpaca SDK for TypeScript

Modern, type-safe TypeScript SDK for Alpaca's Trading, Broker, and Market Data APIs.

## Features

- **Type-safe**: Auto-generated types from OpenAPI specs
- **Universal**: Works in Node.js 18+, Deno, Bun, browsers, and edge runtimes
- **Minimal**: Native `fetch`, zero HTTP dependencies
- **Tree-shakeable**: Import only what you need
- **WebSocket Streaming (Preview)**: Real-time market data and trade updates - in development
- **Modern**: ESM-first with CommonJS compatibility

## Installation

```bash
# Full SDK (recommended)
pnpm add @alpaca-sdk/alpaca-sdk

# Or individual packages
pnpm add @alpaca-sdk/trading
pnpm add @alpaca-sdk/market-data
pnpm add @alpaca-sdk/broker
```

## Quick Start

```typescript
import { createAlpacaClient } from '@alpaca-sdk/alpaca-sdk'

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
const bars = await alpaca.marketData.stocks.getBars('AAPL', {
  start: '2024-01-01',
  end: '2024-01-31',
  timeframe: '1Day',
})
```

## Packages

| Package | Description |
|---------|-------------|
| `@alpaca-sdk/alpaca-sdk` | Complete SDK with all APIs |
| `@alpaca-sdk/trading` | Trading API (orders, positions, account) |
| `@alpaca-sdk/market-data` | Market Data API (stocks, crypto, options, news) |
| `@alpaca-sdk/broker` | Broker API (sub-accounts, funding, KYC) |
| `@alpaca-sdk/streaming` | WebSocket clients for real-time data (preview) |
| `@alpaca-sdk/core` | Shared utilities (auth, errors, types) |

## Configuration

```typescript
import { createTradingClient } from '@alpaca-sdk/trading'

const client = createTradingClient({
  keyId: 'YOUR_API_KEY',
  secretKey: 'YOUR_SECRET_KEY',
  paper: true,           // default: true
  timeout: 30_000,       // default: 30s
  maxRetries: 2,         // default: 2
  baseUrl: 'custom-url', // optional override
})
```

## Error Handling

```typescript
import {
  AlpacaError,
  AuthenticationError,
  RateLimitError,
  InsufficientFundsError
} from '@alpaca-sdk/core'

try {
  await client.orders.create({ ... })
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`)
  } else if (error instanceof InsufficientFundsError) {
    console.log('Not enough buying power')
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API credentials')
  }
}
```

## WebSocket Streaming (Preview)

The streaming package is currently in development. All streaming methods will throw `NotImplementedError` until the feature is complete.

```typescript
import { NotImplementedError } from '@alpaca-sdk/core'

try {
  alpaca.streams.stocks.connect()
} catch (error) {
  if (error instanceof NotImplementedError) {
    console.log(`${error.feature} is not yet available`)
    console.log(`See: ${error.docsUrl}`)
  }
}
```

We're actively working on WebSocket streaming support. Track progress in the repository issues.

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

# Lint code
pnpm lint

# Type check
pnpm typecheck
```

## Requirements

- Node.js >= 18.0.0 (for native `fetch`)
- pnpm >= 9.0.0

## License

MIT
