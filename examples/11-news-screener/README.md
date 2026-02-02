# Example 11 - News and Screener

This example demonstrates how to access **market news** and **screener data** (most active stocks and market movers) through the Alpaca SDK. These are powerful tools for building dashboards, alert systems, and research workflows.

## News API

The Alpaca News API provides access to real-time financial news articles from multiple sources (e.g., Benzinga). You can filter by:

- **Symbols** -- Get news for specific tickers (e.g., AAPL, TSLA)
- **Date range** -- Filter by start and end dates
- **Limit** -- Control how many articles to return (up to 50 per request)
- **Sort order** -- Newest first (default) or oldest first

Each news article includes the headline, author, source, creation date, a summary, the full content, related symbols, and image URLs.

## Screener API

The Screener API helps you discover market activity at a glance:

### Most Actives

Returns the top stocks by **volume** or **trade count** based on real-time SIP data. This is useful for identifying which stocks are seeing the most trading activity right now.

### Market Movers

Returns the top **gainers** and **losers** for stocks or crypto. Each mover includes the current price, absolute price change, and percentage change. This is the data that powers "Top Gainers / Top Losers" widgets in trading platforms.

## Prerequisites

1. An [Alpaca](https://alpaca.markets/) brokerage account (free to sign up)
2. API keys generated from the Alpaca dashboard (use paper trading keys)
3. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed (`npm install -g tsx`)

## How to Run

```bash
ALPACA_KEY_ID=your-key-id ALPACA_SECRET_KEY=your-secret-key npx tsx examples/11-news-screener/index.ts
```

## What You Will See

The script fetches the latest AAPL news headlines, the most actively traded stocks, and the top gainers and losers for the day. Each section displays formatted results with relevant details.
