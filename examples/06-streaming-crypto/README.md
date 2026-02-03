# Example 06 - Streaming Crypto Data

This example demonstrates real-time cryptocurrency market data streaming via WebSocket:

- Connecting to Alpaca's crypto data stream
- Subscribing to trades and bars for **BTC/USD** and **ETH/USD**
- Formatting crypto prices for display
- Graceful shutdown on Ctrl+C

## What You Will See

A continuous stream of real-time crypto trades and bars for BTC/USD and ETH/USD. Runs 24/7 until you press Ctrl+C.

## Crypto vs Stock Streaming

Crypto streaming is similar to stock streaming (Example 05) but with key differences:

- **24/7 availability** - Crypto markets never close, so you will receive data around the clock
- **Location-based feeds** - Instead of choosing a feed type (IEX/SIP), you choose a geographic location
- **Slash-separated symbols** - Crypto uses pairs like `BTC/USD`, `ETH/USD` instead of ticker symbols

## Location Options

| Location | Description        | Availability            |
| -------- | ------------------ | ----------------------- |
| `us`     | Alpaca US exchange | All Alpaca accounts     |
| `us-1`   | Kraken US          | Limited to 23 US states |
| `eu-1`   | Kraken EU          | EU accounts             |

This example uses the `us` location, which is available to all Alpaca accounts.

## Prerequisites

1. An [Alpaca](https://alpaca.markets/) brokerage account with API keys
2. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed

## How to Run

```bash
ALPACA_KEY_ID=your-key-id ALPACA_SECRET_KEY=your-secret-key npx tsx examples/06-streaming-crypto/index.ts
```

The stream runs indefinitely (24/7 since crypto markets never close). Press **Ctrl+C** to stop.
