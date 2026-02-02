# Examples

Runnable examples demonstrating how to use the Alpaca SDK. Each folder contains an `index.ts` file and a `README.md` with usage instructions.

## Setup

1. Install dependencies from the repo root: `pnpm install`
2. Set your Alpaca paper trading API credentials:

```bash
export ALPACA_KEY_ID=your-key-id
export ALPACA_SECRET_KEY=your-secret-key
```

## Examples

| #   | Example                                   | Description                                     |
| --- | ----------------------------------------- | ----------------------------------------------- |
| 01  | [Basic Setup](./01-basic-setup)           | Create a client, get account info, check clock  |
| 02  | [Place Orders](./02-place-order)          | Market, limit, and stop-limit orders            |
| 03  | [Manage Positions](./03-manage-positions) | List, inspect, and close positions              |
| 04  | [Market Data](./04-market-data)           | Historical bars, latest quotes, snapshots       |
| 05  | [Stream Stocks](./05-streaming-stocks)    | Real-time stock trades and quotes via WebSocket |
| 06  | [Stream Crypto](./06-streaming-crypto)    | Real-time crypto data via WebSocket             |
| 07  | [Trade Updates](./07-trade-updates)       | Listen for order fills and cancellations        |
| 08  | [Error Handling](./08-error-handling)     | Both error handling patterns                    |
| 09  | [Options Data](./09-options-data)         | Option chains, snapshots, quotes                |
| 10  | [Watchlists](./10-watchlists)             | Create and manage watchlists                    |
| 11  | [News & Screener](./11-news-screener)     | News articles, most actives, movers             |
| 12  | [Broker Basics](./12-broker-basics)       | Sub-accounts and transfers (Broker API)         |

## Running an Example

```bash
npx tsx examples/01-basic-setup/index.ts
```

All examples use paper trading by default. No real money is at risk.
