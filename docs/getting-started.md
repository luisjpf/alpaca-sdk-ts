# Getting Started

## Prerequisites

- **Node.js** 18 or later
- **TypeScript** 5 or later
- An **Alpaca account** -- sign up and get your API keys at [app.alpaca.markets](https://app.alpaca.markets)

## Installation

```bash
# pnpm
pnpm add @luisjpf/alpaca-sdk

# npm
npm install @luisjpf/alpaca-sdk

# yarn
yarn add @luisjpf/alpaca-sdk

# bun
bun add @luisjpf/alpaca-sdk
```

## Quick Example

```ts
import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

const client = createAlpacaClient({
  keyId: process.env.ALPACA_KEY_ID!,
  secretKey: process.env.ALPACA_SECRET_KEY!,
})

const account = await client.trading.account.get()
console.log(`Buying power: $${account.buying_power}`)
console.log(`Equity: $${account.equity}`)
```

## Paper vs Live Trading

By default, the SDK connects to Alpaca's **paper trading** environment (`paper: true`). Paper trading uses virtual money and is the recommended way to develop and test your strategies.

```ts
// Paper trading (default)
const paper = createAlpacaClient({
  keyId: process.env.ALPACA_KEY_ID!,
  secretKey: process.env.ALPACA_SECRET_KEY!,
})

// Live trading -- REAL MONEY. Only use with live trading credentials
// and a full understanding of the financial risks involved.
const live = createAlpacaClient({
  keyId: process.env.ALPACA_KEY_ID!,
  secretKey: process.env.ALPACA_SECRET_KEY!,
  paper: false,
})
```

## Individual Clients

The unified `createAlpacaClient` is convenient, but if you only need a specific API you can import individual client factories. This is better for tree-shaking and bundle size.

```ts
import { createTradingClient } from '@luisjpf/alpaca-sdk'
import { createMarketDataClient } from '@luisjpf/alpaca-sdk'
import { createBrokerClient } from '@luisjpf/alpaca-sdk'
```

Each factory accepts the same `AlpacaConfig` and returns a typed client for that API.

## Examples

For runnable code demonstrating each SDK feature, see the [examples](../examples/) directory. Start with [Example 01 - Basic Setup](../examples/01-basic-setup/).

## Alpaca API Reference

This SDK wraps the Alpaca APIs. For details on specific endpoints, request fields, order types, timeframes, and other API-specific concepts, see the official [Alpaca API documentation](https://docs.alpaca.markets).

## Next Steps

- [Configuration](./configuration.md) -- all config options, URL resolution, environment variables
- [Error Handling](./error-handling.md) -- error classes, discriminated unions, retry behavior
- [Real-Time Streaming](./streaming.md) -- WebSocket streams for stocks, crypto, and trade updates
- [Advanced Usage](./advanced.md) -- raw client access, type generation, auth helpers
