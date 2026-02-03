---
name: alpaca-sdk
description: Use the @luisjpf/alpaca-sdk TypeScript SDK to interact with Alpaca's Trading, Broker, and Market Data APIs. Use this skill when writing code that trades stocks/crypto, fetches market data, manages brokerage accounts, or streams real-time prices via Alpaca.
---

# Alpaca SDK for TypeScript

## Installation

```bash
pnpm add @luisjpf/alpaca-sdk
```

## Authentication

```typescript
import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

const alpaca = createAlpacaClient({
  keyId: process.env.ALPACA_KEY_ID!,
  secretKey: process.env.ALPACA_SECRET_KEY!,
  paper: true, // default: true (paper trading)
  timeout: 30_000, // default: 30s
  maxRetries: 2, // default: 2
})
```

Config fields: `keyId` (required), `secretKey` (required), `paper?` (boolean, default true), `timeout?` (ms, default 30000), `maxRetries?` (number, default 2), `baseUrl?` (string, custom override).

## Unified Client

`createAlpacaClient(config)` returns:

```typescript
{
  trading: TradingClient,
  marketData: MarketDataClient,
  broker: BrokerClient,
  streams: {
    stocks: StockStream,
    crypto: CryptoStream,
    tradeUpdates: TradeUpdatesStream,
  }
}
```

## Individual Clients (for tree-shaking)

```typescript
import { createTradingClient } from '@luisjpf/alpaca-sdk'
import { createMarketDataClient } from '@luisjpf/alpaca-sdk'
import { createBrokerClient } from '@luisjpf/alpaca-sdk'
import {
  createStockStream,
  createCryptoStream,
  createTradeUpdatesStream,
} from '@luisjpf/alpaca-sdk'
```

## Trading API

All methods are async and throw on error. Every method accepts an optional last argument: `RequestOptions` with `{ timeout?, idempotencyKey?, signal? }`.

### trading.account

- `get()` — Get account info (equity, buying power, status)
- `getConfigurations()` — Get account settings
- `updateConfigurations(updates)` — Update account settings
- `getActivities(params?)` — Get account activities
- `getPortfolioHistory(params?)` — Get portfolio history

### trading.orders

- `list(params?)` — List all orders
- `get(orderId)` — Get order by ID
- `getByClientOrderId(clientOrderId)` — Get order by client order ID
- `create(order)` — Create new order
- `replace(orderId, updates)` — Replace/amend an order
- `cancel(orderId)` — Cancel single order
- `cancelAll()` — Cancel all open orders

Order creation example:

```typescript
const order = await alpaca.trading.orders.create({
  symbol: 'AAPL',
  qty: '10',
  side: 'buy',
  type: 'market',
  time_in_force: 'day',
})
```

### trading.positions

- `list()` — List all open positions
- `get(symbolOrAssetId)` — Get position by symbol or asset ID
- `close(symbolOrAssetId, params?)` — Close a position
- `closeAll(params?)` — Close all positions

### trading.assets

- `list(params?)` — List all assets
- `get(symbolOrAssetId)` — Get asset by symbol or ID

### trading.clock

- `get()` — Get market clock (is_open, next_open, next_close)

### trading.calendar

- `get(params?)` — Get market calendar

### trading.watchlists

- `list()` — List all watchlists
- `get(watchlistId)` — Get watchlist by ID
- `create({ name, symbols? })` — Create watchlist
- `update(watchlistId, { name, symbols? })` — Update watchlist
- `addSymbol(watchlistId, symbol)` — Add symbol to watchlist
- `removeSymbol(watchlistId, symbol)` — Remove symbol from watchlist
- `delete(watchlistId)` — Delete watchlist

## Market Data API

### marketData.stocks

- `getBars(params)` — Historical bars for multiple symbols
- `getSymbolBars(symbol, params)` — Historical bars for one symbol
- `getLatestBars(params)` — Latest bars for multiple symbols
- `getLatestBar(symbol, params?)` — Latest bar for one symbol
- `getTrades(params)` — Historical trades for multiple symbols
- `getSymbolTrades(symbol, params?)` — Historical trades for one symbol
- `getLatestTrades(params)` — Latest trades for multiple symbols
- `getLatestTrade(symbol, params?)` — Latest trade for one symbol
- `getQuotes(params)` — Historical quotes for multiple symbols
- `getSymbolQuotes(symbol, params?)` — Historical quotes for one symbol
- `getLatestQuotes(params)` — Latest quotes for multiple symbols
- `getLatestQuote(symbol, params?)` — Latest quote for one symbol
- `getSnapshots(params)` — Snapshots for multiple symbols
- `getSnapshot(symbol, params?)` — Snapshot for one symbol
- `getAuctions(params)` — Auctions for multiple symbols
- `getSymbolAuctions(symbol, params?)` — Auctions for one symbol
- `getExchanges()` — Get exchange code mappings
- `getConditions(ticktype, params)` — Get condition code mappings (ticktype: `'trade'` | `'quote'`)

Example:

```typescript
const bars = await alpaca.marketData.stocks.getSymbolBars('AAPL', {
  start: '2024-01-01',
  end: '2024-01-31',
  timeframe: '1Day',
})
```

### marketData.crypto

All crypto methods take a location parameter: `'us'` | `'us-1'` | `'eu-1'`

- `getBars(loc, params)` — Historical bars
- `getLatestBars(loc, params)` — Latest bars
- `getTrades(loc, params)` — Historical trades
- `getLatestTrades(loc, params)` — Latest trades
- `getQuotes(loc, params)` — Historical quotes
- `getLatestQuotes(loc, params)` — Latest quotes
- `getSnapshots(loc, params)` — Snapshots
- `getLatestOrderbooks(loc, params)` — Latest orderbooks

### marketData.options

- `getBars(params)` — Historical bars
- `getTrades(params)` — Historical trades
- `getLatestTrades(params)` — Latest trades
- `getLatestQuotes(params)` — Latest quotes
- `getSnapshots(params)` — Snapshots
- `getChain(underlyingSymbol, params?)` — Get option chain
- `getExchanges()` — Exchange code mappings
- `getConditions(ticktype)` — Condition code mappings

### marketData.news

- `get(params?)` — Get news articles (filter by symbols, limit, etc.)

### marketData.screener

- `getMostActives(params?)` — Get most active stocks
- `getMovers(marketType, params?)` — Get market movers (marketType: `'stocks'` | `'crypto'`)

### marketData.corporateActions

- `get(params)` — Get corporate actions

### marketData.forex

- `getLatestRates(params)` — Latest forex rates
- `getRates(params)` — Historical forex rates

### marketData.logos

- `get(symbol, params?)` — Get company logo

## Broker API

The Broker API is for fintech apps managing multiple trading accounts. It uses HTTP Basic auth (handled automatically). Requires separate Broker API credentials.

### broker.accounts

- `list(params?)` — List all sub-accounts
- `get(accountId)` — Get account by ID
- `create(account)` — Create new sub-account
- `update(accountId, updates)` — Update account
- `getTradingAccount(accountId)` — Get trading account details

### broker.activities

- `list(params?)` — Get all activities
- `getByType(activityType, params?)` — Get activities by type

### broker.transfers

- `list(accountId, params?)` — List transfers
- `create(accountId, transfer)` — Create transfer
- `delete(accountId, transferId)` — Cancel transfer

### broker.achRelationships

- `list(accountId)` — List ACH relationships
- `create(accountId, relationship)` — Create ACH relationship
- `delete(accountId, achRelationshipId)` — Delete ACH relationship

### broker.trading.orders

- `list(accountId, params?)` — List orders for account
- `get(accountId, orderId)` — Get order
- `create(accountId, order)` — Create order for account
- `replace(accountId, orderId, updates)` — Replace order
- `cancel(accountId, orderId)` — Cancel order
- `cancelAll(accountId)` — Cancel all orders

### broker.trading.positions

- `list(accountId)` — List positions
- `get(accountId, symbolOrAssetId)` — Get position
- `close(accountId, symbolOrAssetId, params?)` — Close position
- `closeAll(accountId, params?)` — Close all positions

### broker.documents

- `list(accountId, params?)` — List documents
- `download(accountId, documentId)` — Download document

### broker.assets

- `list(params?)` — List assets
- `get(symbolOrAssetId)` — Get asset

### broker.calendar

- `get(params?)` — Get market calendar

### broker.clock

- `get()` — Get market clock

## Streaming (WebSocket)

### Stock Stream

```typescript
import { createStockStream } from '@luisjpf/alpaca-sdk'

const stream = createStockStream({
  keyId: process.env.ALPACA_KEY_ID!,
  secretKey: process.env.ALPACA_SECRET_KEY!,
  feed: 'iex', // 'iex' (free) | 'sip' (paid) | 'delayed_sip'
})

stream.onTrade((trade) => console.log(trade.S, trade.p))
stream.onQuote((quote) => console.log(quote.S, quote.bp, quote.ap))
stream.onBar((bar) => console.log(bar.S, bar.o, bar.h, bar.l, bar.c))
stream.onConnect(() => console.log('Connected'))
stream.onError((err) => console.error(err))

stream.connect()
stream.subscribeForTrades(['AAPL', 'MSFT'])
stream.subscribeForQuotes(['AAPL'])
stream.subscribeForBars(['AAPL'])
```

### Crypto Stream

```typescript
import { createCryptoStream } from '@luisjpf/alpaca-sdk'

const stream = createCryptoStream({
  keyId: process.env.ALPACA_KEY_ID!,
  secretKey: process.env.ALPACA_SECRET_KEY!,
  location: 'us', // 'us' | 'us-1' | 'eu-1'
})

stream.onTrade((trade) => console.log(trade.S, trade.p))
stream.connect()
stream.subscribeForTrades(['BTC/USD', 'ETH/USD'])
```

### Trade Updates Stream

```typescript
import { createTradeUpdatesStream } from '@luisjpf/alpaca-sdk'

const stream = createTradeUpdatesStream({
  keyId: process.env.ALPACA_KEY_ID!,
  secretKey: process.env.ALPACA_SECRET_KEY!,
  paper: true,
})

stream.onTradeUpdate((update) => {
  console.log(update.event, update.order)
})

stream.connect()
stream.subscribe()
```

Methods (all streams): `connect()`, `disconnect()`, `isConnected()`
Stock/Crypto: `subscribeForTrades(symbols)`, `subscribeForQuotes(symbols)`, `subscribeForBars(symbols)`, `unsubscribeFromTrades(symbols)`, `unsubscribeFromQuotes(symbols)`, `unsubscribeFromBars(symbols)`
Trade Updates: `subscribe()`, `unsubscribe()`
Handlers: `onTrade(handler)`, `onQuote(handler)`, `onBar(handler)`, `onTradeUpdate(handler)`, `onConnect(handler)`, `onDisconnect(handler)`, `onError(handler)`

Features: auto-reconnection (exponential backoff 1s-30s), subscription queueing, MessagePack encoding (`useMsgpack: true`).

## Error Handling

All methods throw on error. Two patterns available:

### Pattern 1: Class-based (instanceof)

```typescript
import {
  AlpacaError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  InsufficientFundsError,
  MarketClosedError,
  ServerError,
} from '@luisjpf/alpaca-sdk'

try {
  await alpaca.trading.orders.create(order)
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Retry after ${error.retryAfter}s`)
  } else if (error instanceof NotFoundError) {
    console.log('Not found')
  } else if (error instanceof AlpacaError) {
    console.log(error.message, error.status, error.requestId)
  }
}
```

### Pattern 2: Discriminated unions (type guards)

```typescript
import { AlpacaError, isRateLimitError, isNotFoundError } from '@luisjpf/alpaca-sdk'

try {
  await alpaca.trading.orders.create(order)
} catch (error) {
  if (error instanceof AlpacaError) {
    const apiError = error.toApiError()
    if (isRateLimitError(apiError)) {
      console.log(`Retry after ${apiError.retryAfter}s`)
    }
  }
}
```

Error classes: `AuthenticationError` (401), `ForbiddenError` (403), `InsufficientFundsError` (403), `MarketClosedError` (403), `NotFoundError` (404), `ValidationError` (422), `RateLimitError` (429), `ServerError` (500+).

All errors have: `message`, `code`, `status`, `requestId?`, `type`. `RateLimitError` also has `retryAfter?`.

Automatic retries: 429 and 500+ are retried with exponential backoff. Configure via `maxRetries` (set to 0 to disable).

## Raw Client Escape Hatch

Every client exposes `.raw` — an `openapi-fetch` client typed against the OpenAPI spec:

```typescript
const { data, error } = await alpaca.trading.raw.GET('/v2/account')
```

Note: `.raw` returns `{ data, error }` (openapi-fetch pattern), unlike wrapped methods that throw.

## Important Notes

- All methods are async and return data directly (not wrapped in `{ data, error }`)
- Errors are thrown, not returned — use try/catch
- Types are auto-generated from OpenAPI specs and fully exported
- Use `import type { ... }` for type-only imports (project convention)
- Paper trading is the default — set `paper: false` for live trading
- See https://docs.alpaca.markets for API-specific details (order fields, timeframes, asset classes, etc.)
