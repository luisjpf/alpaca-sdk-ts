# Real-Time Streaming

## Overview

The SDK provides three WebSocket stream types for real-time data:

| Stream        | Factory                      | Data                                    |
| ------------- | ---------------------------- | --------------------------------------- |
| Stock         | `createStockStream()`        | Trades, quotes, bars for US equities    |
| Crypto        | `createCryptoStream()`       | Trades, quotes, bars for crypto pairs   |
| Trade Updates | `createTradeUpdatesStream()` | Order fills, cancellations, expirations |

## Stock Stream

```ts
import { createStockStream } from '@luisjpf/alpaca-sdk'

const stream = createStockStream({
  keyId: process.env.ALPACA_KEY_ID,
  secretKey: process.env.ALPACA_SECRET_KEY,
  feed: 'iex',
})

stream.onTrade((trade) => {
  console.log(`${trade.S}: $${trade.p} x ${trade.s}`)
})

stream.onError((error) => {
  console.error('Stream error:', error.message)
})

stream.connect()
stream.subscribeForTrades(['AAPL', 'MSFT', 'TSLA'])
```

### Configuration

| Field        | Type        | Default    | Description                     |
| ------------ | ----------- | ---------- | ------------------------------- |
| `keyId`      | `string`    | _required_ | API Key ID                      |
| `secretKey`  | `string`    | _required_ | API Secret Key                  |
| `feed`       | `StockFeed` | `'iex'`    | Data feed source                |
| `paper`      | `boolean`   | `true`     | Paper trading environment       |
| `useMsgpack` | `boolean`   | `false`    | Use MessagePack binary encoding |

### Feed Options

| Feed            | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| `'iex'`         | IEX exchange only (free, available on Basic plan)            |
| `'sip'`         | Full SIP feed (paid, requires Algo Trader Plus subscription) |
| `'delayed_sip'` | 15-minute delayed SIP data (free)                            |

### Methods

| Method                           | Description                          |
| -------------------------------- | ------------------------------------ |
| `connect()`                      | Connect to the WebSocket server      |
| `disconnect()`                   | Disconnect from the server           |
| `isConnected()`                  | Check if connected and authenticated |
| `subscribeForTrades(symbols)`    | Subscribe to trade events            |
| `subscribeForQuotes(symbols)`    | Subscribe to quote events            |
| `subscribeForBars(symbols)`      | Subscribe to bar events              |
| `unsubscribeFromTrades(symbols)` | Unsubscribe from trade events        |
| `unsubscribeFromQuotes(symbols)` | Unsubscribe from quote events        |
| `unsubscribeFromBars(symbols)`   | Unsubscribe from bar events          |

### Event Handlers

| Handler                 | Callback Argument |
| ----------------------- | ----------------- |
| `onTrade(handler)`      | `Trade`           |
| `onQuote(handler)`      | `Quote`           |
| `onBar(handler)`        | `Bar`             |
| `onConnect(handler)`    | _(none)_          |
| `onDisconnect(handler)` | _(none)_          |
| `onError(handler)`      | `Error`           |

## Crypto Stream

```ts
import { createCryptoStream } from '@luisjpf/alpaca-sdk'

const stream = createCryptoStream({
  keyId: process.env.ALPACA_KEY_ID,
  secretKey: process.env.ALPACA_SECRET_KEY,
  location: 'us',
})

stream.onTrade((trade) => {
  console.log(`${trade.S}: $${trade.p}`)
})

stream.onBar((bar) => {
  console.log(`${bar.S} bar: O=${bar.o} H=${bar.h} L=${bar.l} C=${bar.c}`)
})

stream.connect()
stream.subscribeForTrades(['BTC/USD', 'ETH/USD'])
stream.subscribeForBars(['BTC/USD'])
```

### Location Options

| Location | Description                         |
| -------- | ----------------------------------- |
| `'us'`   | Alpaca US exchange (default)        |
| `'us-1'` | Kraken US (limited to 23 US states) |
| `'eu-1'` | Kraken EU                           |

The crypto stream has the same methods and event handlers as the stock stream.

## Trade Updates Stream

The trade updates stream delivers real-time order lifecycle events such as fills, partial fills, cancellations, and expirations.

```ts
import { createTradeUpdatesStream } from '@luisjpf/alpaca-sdk'

const stream = createTradeUpdatesStream({
  keyId: process.env.ALPACA_KEY_ID,
  secretKey: process.env.ALPACA_SECRET_KEY,
  paper: true,
})

stream.onTradeUpdate((update) => {
  console.log(`Event: ${update.event}`)
  console.log(`Order: ${JSON.stringify(update.order)}`)
  if (update.price) {
    console.log(`Fill price: $${update.price}`)
  }
})

stream.onConnect(() => {
  console.log('Connected to trade updates')
  stream.subscribe()
})

stream.connect()
```

### Methods

| Method          | Description                          |
| --------------- | ------------------------------------ |
| `connect()`     | Connect to the WebSocket server      |
| `disconnect()`  | Disconnect from the server           |
| `isConnected()` | Check if connected and authenticated |
| `subscribe()`   | Subscribe to trade update events     |
| `unsubscribe()` | Unsubscribe from trade update events |

### Event Handlers

| Handler                  | Callback Argument |
| ------------------------ | ----------------- |
| `onTradeUpdate(handler)` | `TradeUpdate`     |
| `onConnect(handler)`     | _(none)_          |
| `onDisconnect(handler)`  | _(none)_          |
| `onError(handler)`       | `Error`           |

## Connection Lifecycle

All streams follow the same connection state machine:

```
disconnected --> connecting --> authenticating --> connected
      ^                                              |
      |______________________________________________|
                    (on close/error)
```

### Auto-Reconnection

- Streams automatically reconnect when the connection drops
- Backoff: exponential starting at **1 second**, doubling up to a **30-second** max
- Auth errors (401, 402, 403) **stop** reconnection -- these indicate bad credentials
- Connection timeout: **30 seconds** per attempt

### Subscription Queueing

Subscriptions made before `connect()` completes are queued internally and sent automatically once the stream is authenticated. You do not need to wait for the `onConnect` callback to call subscribe methods.

```ts
const stream = createStockStream(config)

// These are queued and sent after authentication
stream.subscribeForTrades(['AAPL', 'MSFT'])
stream.subscribeForQuotes(['AAPL'])

// Connection starts -- queued subs sent once authenticated
stream.connect()
```

## MessagePack

Enable binary MessagePack encoding for lower bandwidth usage:

```ts
const stream = createStockStream({
  keyId: process.env.ALPACA_KEY_ID,
  secretKey: process.env.ALPACA_SECRET_KEY,
  useMsgpack: true,
})
```

Message parsing is handled transparently. The event handler callbacks receive the same typed objects regardless of encoding.

## Graceful Shutdown

Always disconnect streams when your process exits:

```ts
process.on('SIGINT', () => {
  stream.disconnect()
  process.exit(0)
})

process.on('SIGTERM', () => {
  stream.disconnect()
  process.exit(0)
})
```

## Further Reading

For details on message field definitions, event types, and data feed specifics, see the [Alpaca Real-Time Data documentation](https://docs.alpaca.markets/docs/real-time-stock-pricing-data).
