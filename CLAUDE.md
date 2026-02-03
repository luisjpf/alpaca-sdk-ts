# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript SDK for Alpaca's Trading, Broker, and Market Data APIs. Single package with folder-based organization.

## Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Build the package
pnpm test                 # Run all tests
pnpm test:coverage        # Run tests with coverage
pnpm lint                 # Lint source files
pnpm lint:fix             # Fix linting issues
pnpm typecheck            # Type check the project
pnpm format               # Check formatting
pnpm format:fix           # Fix formatting
pnpm generate:types       # Generate TS types from OpenAPI specs
pnpm clean                # Clean dist folder

# Run single test file
pnpm vitest run test/core/auth.test.ts
```

## Architecture

### Folder Structure

```
src/
├── core/           # Foundation: auth, errors, base HTTP client, types
├── trading/        # Trading API (orders, positions, account)
├── market-data/    # Market Data API (stocks, crypto, options, news)
├── broker/         # Broker API (sub-accounts, funding, KYC)
├── streaming/      # WebSocket clients (real-time data)
├── client.ts       # Unified createAlpacaClient factory
└── index.ts        # Main entry point re-exporting everything

test/               # Test files mirroring src structure
specs/              # OpenAPI specifications
scripts/            # Type generation scripts
```

### Module Dependencies

`core` → (all other modules depend on core)
`trading`, `broker`, `market-data` → use `openapi-fetch` with generated types
`streaming` → uses `@msgpack/msgpack` for WebSocket messages
`client.ts` → aggregates all modules into unified `createAlpacaClient()`

### Type Generation

Types are auto-generated from OpenAPI specs in `/specs/` directory:

- `specs/trading-api.json` → `src/trading/generated/trading-api.d.ts`
- `specs/broker-api.json` → `src/broker/generated/broker-api.d.ts`
- `specs/market-data-api.json` → `src/market-data/generated/market-data-api.d.ts`

Run `pnpm generate:types` after updating any spec file.

### Client Pattern

Each API module follows the same factory pattern:

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

Dual error pattern in `src/core`:

- **Class-based**: `AuthenticationError`, `RateLimitError`, etc. for `instanceof` checks
- **Discriminated unions**: `ApiError` type with `type` field for pattern matching
- Factory function `createAlpacaError()` maps HTTP status codes to appropriate error types

### Build Configuration

- **tsup**: Builds to ESM + CJS with `.d.ts` declarations
- Target: ES2022, Node 18+

## Code Conventions

- Strict TypeScript with `noUncheckedIndexedAccess` enabled
- ESLint with strict type-checking rules
- Type imports must use `import type` (enforced by eslint)
- Unused vars prefixed with `_` are allowed
- Tests use Vitest with MSW for API mocking

## Git Conventions

- Do NOT add `Co-Authored-By` lines to commit messages
- Keep commit messages concise and descriptive
- Use conventional commit format: `type: description` (e.g., `fix:`, `feat:`, `docs:`, `chore:`)

## Releasing

To release a new version:

1. Update version in `package.json`
2. Update `CHANGELOG.md` with the new version and changes
3. Commit: `git commit -m "x.y.z"`
4. Push: `git push`
5. Create and push tag: `git tag vx.y.z && git push origin vx.y.z`

**IMPORTANT:** Do NOT manually create GitHub releases with `gh release create`. The Release workflow automatically:
- Publishes to npm with provenance
- Creates the GitHub release with changelog

Manually creating releases causes the workflow to fail and shows a failing badge on the repo.
