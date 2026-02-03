# Example 12 - Broker API Basics

This example demonstrates the basics of the **Alpaca Broker API**, which is designed for fintech applications that manage multiple trading accounts on behalf of their end users.

## What Is the Broker API?

While the Trading API is for individual traders managing their own account, the Broker API is for **businesses** that need to:

- **Create and manage sub-accounts** for their customers (e.g., a robo-advisor creating accounts for each user)
- **Trade on behalf** of multiple accounts (e.g., a portfolio management platform executing trades for clients)
- **Fund accounts** through ACH transfers and wire transfers
- **Handle KYC/AML** (Know Your Customer / Anti-Money Laundering) compliance

Think of it as the API that powers apps like Robinhood, Wealthfront, or any fintech product that offers investing features.

## Important Differences from the Trading API

| Feature         | Trading API                   | Broker API                        |
| --------------- | ----------------------------- | --------------------------------- |
| **Purpose**     | Individual trading            | Multi-account management          |
| **Auth**        | API key header                | HTTP Basic auth (handled by SDK)  |
| **Credentials** | From alpaca.markets dashboard | From broker-app.alpaca.markets    |
| **Base URL**    | paper-api.alpaca.markets      | broker-api.sandbox.alpaca.markets |
| **Accounts**    | Your own account              | Multiple sub-accounts             |

## Separate Credentials Required

The Broker API requires **separate credentials** from the Trading API. You need to:

1. Sign up at [https://broker-app.alpaca.markets](https://broker-app.alpaca.markets)
2. Complete the broker application process
3. Generate API keys from the broker dashboard

The SDK automatically handles the authentication difference (HTTP Basic auth vs API key headers) when you use `createBrokerClient`.

## Prerequisites

1. A [Broker API](https://broker-app.alpaca.markets) account (separate from regular Alpaca account)
2. Broker API keys from the broker dashboard
3. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed (`npm install -g tsx`)

## How to Run

```bash
ALPACA_KEY_ID=your-broker-key ALPACA_SECRET_KEY=your-broker-secret npx tsx examples/12-broker-basics/index.ts
```

## What You Will See

The script lists existing sub-accounts, checks the market clock, and explains the structure for creating accounts and managing transfers. Since creating accounts requires a real broker sandbox setup, the account creation flow is explained in comments.
