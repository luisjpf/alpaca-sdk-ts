# Configuration

## AlpacaConfig

Every client factory accepts an `AlpacaConfig` object:

```ts
import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

const client = createAlpacaClient({
  keyId: 'AKXXXXXXXXXXXXXXXXXX',
  secretKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  paper: true,
  timeout: 30000,
  maxRetries: 2,
})
```

### Fields

| Field        | Type      | Default    | Description                                        |
| ------------ | --------- | ---------- | -------------------------------------------------- |
| `keyId`      | `string`  | _required_ | API Key ID                                         |
| `secretKey`  | `string`  | _required_ | API Secret Key                                     |
| `paper`      | `boolean` | `true`     | Use paper trading environment                      |
| `timeout`    | `number`  | `30000`    | Request timeout in milliseconds                    |
| `maxRetries` | `number`  | `2`        | Max retry attempts for retryable errors            |
| `baseUrl`    | `string`  | _auto_     | Custom base URL override (bypasses URL resolution) |

### Default Values

```ts
{
  paper: true,
  timeout: 30_000,   // 30 seconds
  maxRetries: 2,
}
```

## URL Resolution

The SDK automatically resolves the correct base URL depending on the API type and the `paper` setting. Setting `baseUrl` overrides this behavior entirely.

| API         | Paper (`paper: true`)                       | Live (`paper: false`)               |
| ----------- | ------------------------------------------- | ----------------------------------- |
| Trading     | `https://paper-api.alpaca.markets`          | `https://api.alpaca.markets`        |
| Broker      | `https://broker-api.sandbox.alpaca.markets` | `https://broker-api.alpaca.markets` |
| Market Data | `https://data.alpaca.markets`               | `https://data.alpaca.markets`       |

Market Data always uses the same URL regardless of the `paper` setting.

## Unified vs Individual Clients

### Unified Client

The `createAlpacaClient` factory returns all APIs in one object:

```ts
import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

const client = createAlpacaClient(config)

// Access all APIs from one client
client.trading // Trading API
client.marketData // Market Data API
client.broker // Broker API
client.streams.stocks.crypto.tradeUpdates // WebSocket streams //   Stock data stream //   Crypto data stream //   Trade updates stream
```

### Individual Clients

For tree-shaking and smaller bundles, import only what you need:

```ts
import { createTradingClient } from '@luisjpf/alpaca-sdk'
import { createMarketDataClient } from '@luisjpf/alpaca-sdk'
import { createBrokerClient } from '@luisjpf/alpaca-sdk'

const trading = createTradingClient(config)
const marketData = createMarketDataClient(config)
const broker = createBrokerClient(config)
```

## Environment Variables

The SDK does not read environment variables directly. The recommended pattern is to pass them in yourself:

```ts
const client = createAlpacaClient({
  keyId: process.env.ALPACA_KEY_ID,
  secretKey: process.env.ALPACA_SECRET_KEY,
})
```

Example `.env` file:

```
ALPACA_KEY_ID=your-key
ALPACA_SECRET_KEY=your-secret
```

## RequestOptions

Individual API calls accept an optional `RequestOptions` object for per-request control:

```ts
interface RequestOptions {
  /** Custom timeout for this request */
  timeout?: number
  /** Idempotency key for POST/PATCH requests */
  idempotencyKey?: string
  /** AbortSignal for request cancellation */
  signal?: AbortSignal
}
```

Usage:

```ts
const orders = await client.trading.orders.list({ status: 'open' }, { timeout: 5000 })
```

See [Advanced Usage](./advanced.md) for more details on request options.
