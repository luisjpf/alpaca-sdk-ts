# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-26

### Added

#### Core Package (`@luisjpf/core`)

- HTTP client with automatic retry and exponential backoff
- Support for both API key and OAuth authentication
- Comprehensive error types (`AlpacaError`, `RateLimitError`, `AuthenticationError`, etc.)
- Request/response unwrapping utilities
- Credential validation helpers
- Paper trading support

#### Trading Package (`@luisjpf/trading`)

- Account management (get account info, configurations)
- Order management (create, cancel, list orders)
- Position management (get positions, close positions)
- Asset information retrieval
- Watchlist management
- Calendar and clock endpoints
- Corporate announcements

#### Market Data Package (`@luisjpf/market-data`)

- Historical stock bars, trades, and quotes
- Real-time snapshots
- Options data (trades, quotes, snapshots)
- Crypto market data
- News articles
- Corporate actions
- Most active stocks
- Market movers

#### Broker Package (`@luisjpf/broker`)

- Account creation and management
- KYC/CIP verification
- Document management
- Trading account operations
- Transfer management
- Journal management
- Asset management

#### Streaming Package (`@luisjpf/streaming`)

- Real-time stock data streaming
  - IEX feed (free)
  - SIP feed (paid Algo Trader Plus)
  - Delayed SIP feed (15-minute delayed)
- Real-time crypto data streaming
  - US location (Alpaca exchange)
  - US-1 location (Kraken US)
  - EU-1 location (Kraken EU)
- Trade updates streaming (order fills, cancellations, rejections)
- Automatic reconnection with exponential backoff
- MessagePack encoding support

#### Unified Package (`@luisjpf/alpaca-sdk`)

- Single entry point for all SDK functionality
- Factory function for creating clients

### CI/CD

- GitHub Actions workflow for PR checks
- Automated test coverage reports on PRs
- Security audit (non-blocking) on PRs
- Release workflow for automated npm publishing

### Documentation

- Comprehensive README with examples
- TypeScript types fully documented
- JSDoc comments for all public APIs
