# Example 07 - Trade Updates Streaming

This example demonstrates how to use WebSocket streaming to receive **real-time trade updates** (order status changes) from Alpaca. Trade updates are essential for any trading application that needs to react to order lifecycle events as they happen, rather than polling for status changes.

## What Are Trade Updates?

When you place an order through the Alpaca Trading API, it goes through several state transitions. Trade updates notify you in real time when these transitions occur:

- **`new`** -- Your order has been received and accepted by the exchange
- **`fill`** -- Your order has been completely filled (all shares executed)
- **`partial_fill`** -- Some (but not all) shares of your order have been executed
- **`canceled`** -- Your order was canceled (either by you or the system)
- **`expired`** -- Your order expired without being filled (e.g., day orders at market close)
- **`rejected`** -- Your order was rejected by the exchange or Alpaca's risk engine
- **`replaced`** -- Your order was successfully replaced with new parameters
- **`pending_new`** -- Your order is being routed to the exchange
- **`pending_cancel`** -- Your cancel request is being processed
- **`pending_replace`** -- Your replace request is being processed
- **`stopped`** -- Your order has been stopped (exchange-specific)
- **`suspended`** -- Your order has been suspended

## How It Works

The SDK uses a WebSocket connection to Alpaca's streaming servers. The connection automatically handles:

1. **Authentication** -- Sends your API credentials to the WebSocket server
2. **Subscription** -- Subscribes to the `trade_updates` stream
3. **Reconnection** -- Automatically reconnects with exponential backoff if the connection drops

## Prerequisites

1. An [Alpaca](https://alpaca.markets/) brokerage account (free to sign up)
2. API keys generated from the Alpaca dashboard (use paper trading keys)
3. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed (`npm install -g tsx`)

## How to Run

```bash
ALPACA_KEY_ID=your-key-id ALPACA_SECRET_KEY=your-secret-key npx tsx examples/07-trade-updates/index.ts
```

## What You Will See

The script connects to Alpaca's WebSocket server, authenticates, and starts listening for trade updates. It optionally places a small test market order to trigger events. You will see real-time logs showing order events such as `new`, `fill`, and `partial_fill`, along with details like order ID, symbol, fill price, and fill quantity.

Press `Ctrl+C` to gracefully disconnect.
