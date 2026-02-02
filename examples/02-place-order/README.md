# Example 02 - Place Orders

This example demonstrates how to place different types of stock orders using the Alpaca SDK:

- **Market order** - Buy at the current market price (fills immediately when market is open)
- **Limit order** - Buy only when the price drops to your specified price or lower
- **Stop-limit order** - A conditional order that becomes a limit order once a stop price is reached
- Listing recent orders to check their status
- Cancelling all open orders for cleanup

## Important: Paper Trading Only

This example is configured to use **paper trading** (simulated money). No real money is at risk. Make sure your API keys are from the paper trading dashboard.

## Prerequisites

1. An [Alpaca](https://alpaca.markets/) brokerage account with paper trading API keys
2. Node.js 18+ and [tsx](https://github.com/privatenumber/tsx) installed

## How to Run

```bash
ALPACA_KEY_ID=your-key-id ALPACA_SECRET_KEY=your-secret-key npx tsx examples/02-place-order/index.ts
```

## Order Types Reference

| Type         | Description                                    | Required Fields                                  |
| ------------ | ---------------------------------------------- | ------------------------------------------------ |
| `market`     | Execute immediately at best available price    | `symbol`, `qty`, `side`, `type`, `time_in_force` |
| `limit`      | Execute only at specified price or better      | Above + `limit_price`                            |
| `stop_limit` | Becomes limit order when stop price is reached | Above + `stop_price`, `limit_price`              |

See the [Alpaca Orders Documentation](https://docs.alpaca.markets/docs/orders-at-alpaca) for the full list of order types and parameters.
