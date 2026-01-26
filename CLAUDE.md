# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript SDK for Alpaca's Trading, Broker, and Market Data APIs. Monorepo using pnpm workspaces with Turborepo for orchestration.

## Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Build all packages (uses turbo)
pnpm test                 # Run all tests
pnpm test:coverage        # Run tests with coverage
pnpm lint                 # Lint all packages
pnpm lint:fix             # Fix linting issues
pnpm typecheck            # Type check all packages
pnpm format               # Check formatting
pnpm format:fix           # Fix formatting
pnpm generate:types       # Generate TS types from OpenAPI specs
pnpm clean                # Clean all dist folders

# Single package commands (run from package directory)
cd packages/trading && pnpm test      # Run tests for trading package only
cd packages/core && pnpm lint:fix     # Fix lint in core package only

# Run single test file
pnpm vitest run packages/core/src/auth.test.ts
```

## Architecture

### Package Structure

```
packages/
├── core/           # Foundation: auth, errors, base HTTP client, types
├── trading/        # Trading API (orders, positions, account)
├── market-data/    # Market Data API (stocks, crypto, options, news)
├── broker/         # Broker API (sub-accounts, funding, KYC)
├── streaming/      # WebSocket clients (real-time data)
└── alpaca-sdk/     # Unified client re-exporting all packages
```

### Dependency Graph

`core` → (all other packages depend on core)
`trading`, `broker`, `market-data` → use `openapi-fetch` with generated types
`streaming` → uses `@msgpack/msgpack` for WebSocket messages
`alpaca-sdk` → aggregates all packages into unified `createAlpacaClient()`

### Type Generation

Types are auto-generated from OpenAPI specs in `/specs/` directory:

- `specs/trading-api.json` → `packages/trading/src/generated/trading-api.d.ts`
- `specs/broker-api.json` → `packages/broker/src/generated/broker-api.d.ts`
- `specs/market-data-api.json` → `packages/market-data/src/generated/market-data-api.d.ts`

Run `pnpm generate:types` after updating any spec file.

### Client Pattern

Each API package follows the same factory pattern:

```typescript
// Factory creates typed client with namespaced methods
export function createTradingClient(config: AlpacaConfig) {
  const client = createClient<paths>({ baseUrl, headers: auth })
  return {
    raw: client,           // Raw openapi-fetch for advanced usage
    account: { get(), ... },
    orders: { list(), create(), ... },
    positions: { list(), close(), ... },
    // etc.
  }
}
```

### Error System

Dual error pattern in `@alpaca-sdk/core`:

- **Class-based**: `AuthenticationError`, `RateLimitError`, etc. for `instanceof` checks
- **Discriminated unions**: `ApiError` type with `type` field for pattern matching
- Factory function `createAlpacaError()` maps HTTP status codes to appropriate error types

### Build Configuration

- **tsup**: Builds each package to ESM + CJS with `.d.ts` declarations
- **Turbo**: Orchestrates builds with dependency awareness (`^build` means build deps first)
- Target: ES2022, Node 18+

## Code Conventions

- Strict TypeScript with `noUncheckedIndexedAccess` enabled
- ESLint with strict type-checking rules
- Type imports must use `import type` (enforced by eslint)
- Unused vars prefixed with `_` are allowed
- Tests use Vitest with MSW for API mocking
