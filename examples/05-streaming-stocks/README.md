# Example 05 - Streaming Stock Data

This example demonstrates real-time stock market data streaming via WebSocket:

- Connecting to Alpaca's real-time stock data stream
- Subscribing to **trades**, **quotes**, and **bars** for specific symbols
- Handling each event type with callback functions
- Graceful shutdown on Ctrl+C

## Data Feeds

Alpaca offers three stock data feeds:

| Feed          | Description                                  | Cost                    |
| ------------- | -------------------------------------------- | ----------------------- |
| `iex`         | IEX Exchange data only (~2-3% of US volume)  | Free (Basic plan)       |
| `sip`         | Full consolidated data from all US exchanges | Paid (Algo Trader Plus) |
| `delayed_sip` | 15-minute delayed SIP data                   | Free (Basic plan)       |

This example uses the `iex` feed, which is available on the free Basic plan.

## Event Types

- **Trade** - An executed transaction (symbol, price, size, timestamp)
- **Quote** - A change in bid/ask prices (symbol, bid, ask, sizes)
- **Bar** - An aggregated OHLCV candlestick (symbol, open, high, low, close, volume)

## Prerequisites

1. An [Alpaca](https://alpaca.markets/) brokerage account with API keys
2. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed

## How to Run

```bash
ALPACA_KEY_ID=your-key-id ALPACA_SECRET_KEY=your-secret-key npx tsx examples/05-streaming-stocks/index.ts
```

The stream runs indefinitely. Press **Ctrl+C** to stop.
