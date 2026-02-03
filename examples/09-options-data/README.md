# Example 09 - Options Data

This example demonstrates how to access **options market data** through the Alpaca SDK, including option chains, latest quotes, and snapshots with Greeks.

## What Is Options Data?

Options are financial derivatives that give the holder the right (but not the obligation) to buy or sell an underlying asset at a specific price (the **strike price**) before a specific date (the **expiration date**).

Alpaca provides market data for US-listed equity options, including:

- **Option Chains** -- All available contracts for a given underlying symbol (e.g., all AAPL calls and puts across strike prices and expirations)
- **Quotes** -- Current bid/ask prices and sizes for option contracts
- **Trades** -- Historical trade data for option contracts
- **Snapshots** -- Comprehensive point-in-time view including the latest trade, latest quote, daily bar, and **Greeks** (delta, gamma, theta, vega, rho)

## Option Contract Symbols

Option contracts use the OCC (Options Clearing Corporation) symbology format:

```
AAPL250117C00150000
^^^^ ^^^^^^ ^ ^^^^^^^^
|    |      | |
|    |      | Strike price ($150.00, padded to 8 digits)
|    |      Call (C) or Put (P)
|    Expiration date (YYMMDD)
Underlying symbol (left-padded with spaces, up to 6 chars)
```

## Data Feeds

- **`opra`** -- Official OPRA feed (requires paid subscription)
- **`indicative`** -- Free indicative feed with delayed trades and modified quotes (default if no subscription)

For more details, see the [Alpaca Options API documentation](https://docs.alpaca.markets/docs/options-market-data).

## Prerequisites

1. An [Alpaca](https://alpaca.markets/) brokerage account (free to sign up)
2. API keys generated from the Alpaca dashboard (use paper trading keys)
3. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed (`npm install -g tsx`)

## How to Run

```bash
ALPACA_KEY_ID=your-key-id ALPACA_SECRET_KEY=your-secret-key npx tsx examples/09-options-data/index.ts
```

## What You Will See

The script fetches the option chain for AAPL, displays contract details (symbol, strike, type, expiration), retrieves latest quotes and snapshots for specific contracts, and prints bid/ask prices, last trade prices, and Greeks.
