# Example 03 - Manage Positions

This example demonstrates how to manage your portfolio positions with the Alpaca SDK:

- Listing all open positions with key metrics
- Getting a specific position by stock symbol
- Partially closing a position (selling only a portion of your shares)
- Closing all positions at once (liquidating the portfolio)

## What You Will See

The script lists all open positions, fetches a specific AAPL position, partially closes it, then liquidates all remaining positions.

## What is a Position?

A position represents your current holding in a particular stock or asset. When you buy shares, a position is created. The position tracks:

- **Quantity** - How many shares you hold
- **Market value** - Current dollar value of the position
- **Unrealized P/L** - How much you have gained or lost since buying (before selling)
- **Cost basis** - The total amount you originally paid

## Prerequisites

1. An [Alpaca](https://alpaca.markets/) brokerage account with paper trading API keys
2. Existing positions in your paper account (run Example 02 first to create some)
3. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed

## How to Run

```bash
ALPACA_KEY_ID=your-key-id ALPACA_SECRET_KEY=your-secret-key npx tsx examples/03-manage-positions/index.ts
```
