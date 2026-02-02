# Example 10 - Watchlists

This example demonstrates **watchlist CRUD operations** (Create, Read, Update, Delete) using the Alpaca SDK. Watchlists let you organize and track groups of symbols that you're interested in.

## What Are Watchlists?

Watchlists are named collections of stock symbols that you can use to:

- **Organize** your universe of tradeable assets into logical groups (e.g., "Tech Stocks", "Dividend Plays", "Earnings Watch")
- **Track** groups of symbols for monitoring and analysis
- **Manage** your investment research workflow

Alpaca supports up to 256 characters for watchlist names, and each watchlist can contain any number of valid US equity symbols.

## Available Operations

The Alpaca Watchlist API supports the following operations:

| Operation     | Method                                     | Description                     |
| ------------- | ------------------------------------------ | ------------------------------- |
| List all      | `watchlists.list()`                        | Get all your watchlists         |
| Get one       | `watchlists.get(id)`                       | Get a specific watchlist by ID  |
| Create        | `watchlists.create({ name, symbols })`     | Create a new watchlist          |
| Update        | `watchlists.update(id, { name, symbols })` | Replace the name and/or symbols |
| Add symbol    | `watchlists.addSymbol(id, symbol)`         | Add a single symbol             |
| Remove symbol | `watchlists.removeSymbol(id, symbol)`      | Remove a single symbol          |
| Delete        | `watchlists.delete(id)`                    | Delete a watchlist permanently  |

## Prerequisites

1. An [Alpaca](https://alpaca.markets/) brokerage account (free to sign up)
2. API keys generated from the Alpaca dashboard (use paper trading keys)
3. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed (`npm install -g tsx`)

## How to Run

```bash
ALPACA_KEY_ID=your-key-id ALPACA_SECRET_KEY=your-secret-key npx tsx examples/10-watchlists/index.ts
```

## What You Will See

The script creates a "My Tech Stocks" watchlist, lists all watchlists, adds and removes symbols, and then cleans up by deleting the watchlist. Each step is logged with full details.
