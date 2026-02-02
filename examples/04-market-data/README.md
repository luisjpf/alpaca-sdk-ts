# Example 04 - Market Data

This example demonstrates how to fetch market data using the Alpaca SDK:

- **Historical bars** - OHLCV (Open, High, Low, Close, Volume) candlestick data over a date range
- **Latest quote** - Real-time bid/ask prices and spread
- **Snapshots** - A consolidated view of a stock's latest trade, latest quote, daily bar, and previous daily bar
- **Latest trade** - The most recent executed trade for a symbol

## Historical vs Real-Time Data

Alpaca provides two flavors of market data:

- **Historical data** - Past prices, bars, trades, and quotes. Useful for backtesting and analysis.
- **Real-time data** - Current prices streamed via WebSocket (see Examples 05 and 06 for streaming).

This example focuses on the REST API for fetching point-in-time and historical data.

## Data Feeds

- **IEX** (free) - Data from the Investors Exchange only (~2-3% of US volume)
- **SIP** (paid) - Full consolidated feed from all US exchanges (requires Algo Trader Plus subscription)

## Prerequisites

1. An [Alpaca](https://alpaca.markets/) brokerage account with API keys
2. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed

## How to Run

```bash
ALPACA_KEY_ID=your-key-id ALPACA_SECRET_KEY=your-secret-key npx tsx examples/04-market-data/index.ts
```
