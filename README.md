# Alpaca SDK for TypeScript

[![CI](https://github.com/luisjpf/alpaca-sdk-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/luisjpf/alpaca-sdk-ts/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@alpaca-sdk/alpaca-sdk.svg)](https://www.npmjs.com/package/@alpaca-sdk/alpaca-sdk)
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
# Full SDK (recommended)
pnpm add @alpaca-sdk/alpaca-sdk

# Or individual packages
pnpm add @alpaca-sdk/trading
pnpm add @alpaca-sdk/market-data
pnpm add @alpaca-sdk/broker
pnpm add @alpaca-sdk/streaming
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

| Package                   | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `@alpaca-sdk/alpaca-sdk`  | Complete SDK with all APIs                      |
| `@alpaca-sdk/trading`     | Trading API (orders, positions, account)        |
| `@alpaca-sdk/market-data` | Market Data API (stocks, crypto, options, news) |
| `@alpaca-sdk/broker`      | Broker API (sub-accounts, funding, KYC)         |
| `@alpaca-sdk/streaming`   | WebSocket clients for real-time data            |
| `@alpaca-sdk/core`        | Shared utilities (auth, errors, types)          |

## Configuration

```typescript
import { createTradingClient } from '@alpaca-sdk/trading'

const client = createTradingClient({
  keyId: 'YOUR_API_KEY',
  secretKey: 'YOUR_SECRET_KEY',
  paper: true, // default: true
  timeout: 30_000, // default: 30s
  maxRetries: 2, // default: 2
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

## WebSocket Streaming

Real-time market data and trade updates via WebSocket.

### Stock Data Streaming

```typescript
import { createStockStream } from '@alpaca-sdk/streaming'

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
import { createCryptoStream } from '@alpaca-sdk/streaming'

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
import { createTradeUpdatesStream } from '@alpaca-sdk/streaming'

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
