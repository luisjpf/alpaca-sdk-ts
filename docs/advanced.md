# Advanced Usage

## Raw Client

Every client factory exposes a `.raw` property -- an `openapi-fetch` client typed against the Alpaca OpenAPI spec. Use it for endpoints not yet wrapped by the SDK, or when you need full control over the request.

```ts
const client = createTradingClient({
  keyId: process.env.ALPACA_KEY_ID,
  secretKey: process.env.ALPACA_SECRET_KEY,
})

const { data, error } = await client.raw.GET('/v2/account')

if (error) {
  console.error('API error:', error)
} else {
  console.log('Account:', data)
}
```

The raw client returns `{ data, error }` instead of throwing. This is the standard `openapi-fetch` pattern. The wrapped methods (e.g. `client.account.get()`) throw `AlpacaError` instances on failure.

## Request Options

### AbortSignal

Cancel individual requests using an `AbortSignal`:

```ts
const controller = new AbortController()

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000)

const account = await client.trading.account.get({ signal: controller.signal })
```

### Per-Request Timeout

Override the client-level timeout for a single request:

```ts
const orders = await client.trading.orders.list(
  { status: 'open' },
  { timeout: 5000 } // 5 seconds for this request only
)
```

### Idempotency Key

Prevent duplicate operations on POST/PATCH requests. The SDK sends the key as the `Idempotency-Key` header:

```ts
const order = await client.trading.orders.create(
  {
    symbol: 'AAPL',
    qty: '1',
    side: 'buy',
    type: 'market',
    time_in_force: 'day',
  },
  { idempotencyKey: 'unique-order-id-123' }
)
```

If the same idempotency key is sent twice, Alpaca returns the original response instead of creating a duplicate order.

## Type Generation

Types are auto-generated from OpenAPI specifications stored in the `specs/` directory:

| Spec File                    | Generated Types                                  |
| ---------------------------- | ------------------------------------------------ |
| `specs/trading-api.json`     | `src/trading/generated/trading-api.d.ts`         |
| `specs/broker-api.json`      | `src/broker/generated/broker-api.d.ts`           |
| `specs/market-data-api.json` | `src/market-data/generated/market-data-api.d.ts` |

After updating any spec file, regenerate the types:

```bash
pnpm generate:types
```

Generated types are re-exported from the package as named types. For example:

```ts
import type { TradingOrder, TradingAccount, StockBar, CryptoTrade, News } from '@luisjpf/alpaca-sdk'
```

For full access to the generated `paths`, `components`, and `operations` types:

```ts
import type { paths, components } from '@luisjpf/alpaca-sdk'
```

## Auth Helpers

The SDK exports standalone auth functions. These are used internally by the client factories, but you can use them directly if building a custom HTTP client:

```ts
import { createApiKeyAuth, createBasicAuth, createOAuthAuth } from '@luisjpf/alpaca-sdk'

// API Key auth (Trading, Market Data)
const apiKeyHeaders = createApiKeyAuth('your-key-id', 'your-secret')
// { 'APCA-API-KEY-ID': '...', 'APCA-API-SECRET-KEY': '...' }

// HTTP Basic auth (Broker API)
const basicHeaders = createBasicAuth('your-key-id', 'your-secret')
// { 'Authorization': 'Basic ...' }

// OAuth Bearer token
const oauthHeaders = createOAuthAuth('your-oauth-token')
// { 'Authorization': 'Bearer ...' }
```

You only need these if you are making custom `fetch` calls outside the SDK. The client factories handle auth automatically.

## Individual Client Factories

For tree-shaking and smaller bundles, import only the clients you need:

### REST Clients

```ts
import { createTradingClient } from '@luisjpf/alpaca-sdk'
import { createMarketDataClient } from '@luisjpf/alpaca-sdk'
import { createBrokerClient } from '@luisjpf/alpaca-sdk'

const config = {
  keyId: process.env.ALPACA_KEY_ID,
  secretKey: process.env.ALPACA_SECRET_KEY,
}

const trading = createTradingClient(config)
const marketData = createMarketDataClient(config)
const broker = createBrokerClient(config)
```

### Stream Clients

```ts
import {
  createStockStream,
  createCryptoStream,
  createTradeUpdatesStream,
} from '@luisjpf/alpaca-sdk'

const streamConfig = {
  keyId: process.env.ALPACA_KEY_ID,
  secretKey: process.env.ALPACA_SECRET_KEY,
}

const stocks = createStockStream({ ...streamConfig, feed: 'iex' })
const crypto = createCryptoStream({ ...streamConfig, location: 'us' })
const tradeUpdates = createTradeUpdatesStream(streamConfig)
```

See [Configuration](./configuration.md) for the full list of config options.
