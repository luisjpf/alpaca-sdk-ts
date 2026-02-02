# Example 01 - Basic Setup

This example demonstrates the foundational steps for using the Alpaca SDK:

- Creating an authenticated Alpaca client configured for paper trading
- Retrieving your account information (equity, buying power, account status)
- Checking the market clock (whether the market is currently open, and when it opens or closes next)

## Prerequisites

1. An [Alpaca](https://alpaca.markets/) brokerage account (free to sign up)
2. API keys generated from the Alpaca dashboard (use paper trading keys)
3. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed (`npm install -g tsx`)

## How to Run

```bash
ALPACA_KEY_ID=your-key-id ALPACA_SECRET_KEY=your-secret-key npx tsx examples/01-basic-setup/index.ts
```

## What You Will See

The script prints your account summary (equity, cash, buying power, status) and the current market clock state (open/closed, next open time, next close time).
