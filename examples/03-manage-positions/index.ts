/**
 * Example 03 - Manage Positions
 *
 * Positions represent the stocks (or other assets) you currently hold.
 * This example shows how to list, inspect, and close positions — the
 * fundamental operations for managing a portfolio.
 */

// Import the unified client factory. Position management lives under
// `alpaca.trading.positions`.
import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

async function main() {
  // -----------------------------------------------------------------------
  // Step 1: Create the Alpaca client
  // -----------------------------------------------------------------------
  // Validate that credentials are set before proceeding.
  const keyId = process.env.ALPACA_KEY_ID
  const secretKey = process.env.ALPACA_SECRET_KEY
  if (!keyId || !secretKey) {
    console.error('Please set ALPACA_KEY_ID and ALPACA_SECRET_KEY environment variables')
    process.exit(1)
  }

  const alpaca = createAlpacaClient({
    keyId,
    secretKey,
    paper: true,
  })

  // -----------------------------------------------------------------------
  // Step 2: List all open positions
  // -----------------------------------------------------------------------
  // `positions.list()` returns every position in your portfolio.
  // A position exists as long as you hold at least 1 share of a symbol.
  // Once all shares are sold, the position disappears from this list.
  console.log('=== All Open Positions ===')
  const positions = await alpaca.trading.positions.list()

  // If you have no positions, the array will be empty. This is normal
  // for a fresh paper account or after closing everything.
  if (positions.length === 0) {
    console.log('  No open positions. Run Example 02 first to create some.')
    console.log()
  } else {
    // Print each position with its most important metrics.
    // `unrealized_pl` is the profit/loss you would realize if you sold now.
    // `current_price` comes from the latest market data, so it updates in real time.
    // `change_today` shows the percentage change since today's market open.
    for (const position of positions) {
      console.log(`  ${position.symbol}:`)
      console.log(`    Qty:             ${position.qty}`)
      console.log(`    Market Value:    $${position.market_value}`)
      console.log(`    Cost Basis:      $${position.cost_basis}`)
      console.log(`    Unrealized P/L:  $${position.unrealized_pl}`)
      console.log(`    Current Price:   $${position.current_price}`)
      console.log(`    Change Today:    ${position.change_today}%`)
      console.log()
    }
  }

  // -----------------------------------------------------------------------
  // Step 3: Get a specific position by symbol
  // -----------------------------------------------------------------------
  // If you know which symbol you want to check, `positions.get()` is more
  // efficient than listing all positions and filtering client-side.
  // It accepts either a ticker symbol (e.g., 'AAPL') or an asset UUID.
  //
  // We wrap this in a try/catch because Alpaca returns a 404 error if
  // you do not hold any shares of the requested symbol.
  console.log('=== Position for AAPL ===')
  try {
    const aaplPosition = await alpaca.trading.positions.get('AAPL')
    console.log(`  Symbol:          ${aaplPosition.symbol}`)
    console.log(`  Qty:             ${aaplPosition.qty}`)
    console.log(`  Avg Entry Price: $${aaplPosition.avg_entry_price}`)
    console.log(`  Market Value:    $${aaplPosition.market_value}`)
    console.log(`  Unrealized P/L:  $${aaplPosition.unrealized_pl}`)
  } catch {
    // A 404 means you do not currently hold AAPL. This is expected if
    // you have not bought any shares or have already sold them all.
    console.log('  No position in AAPL (you may need to buy some first)')
  }
  console.log()

  // -----------------------------------------------------------------------
  // Step 4: Close a position partially (50% of shares)
  // -----------------------------------------------------------------------
  // Partial closes let you take profits or reduce risk without
  // liquidating your entire position. You specify how many shares
  // to sell via the `qty` query parameter.
  //
  // For example, if you hold 10 shares and close with qty=5, you will
  // sell 5 shares and keep the remaining 5.
  //
  // Alternatively, you can use `percentage` instead of `qty` to close
  // a percentage of the position (e.g., percentage='50' for 50%).
  console.log('=== Partially Closing AAPL (50%) ===')
  try {
    // First, fetch the current position to know how many shares we hold.
    const currentPosition = await alpaca.trading.positions.get('AAPL')
    const currentQty = Number(currentPosition.qty)

    // Calculate 50% of shares, rounding down to a whole number.
    // You cannot sell fractional shares via the close endpoint
    // unless the position itself is fractional.
    const halfQty = Math.floor(currentQty / 2)

    if (halfQty > 0) {
      // The `close` method sends a DELETE request for the position,
      // with the qty parameter telling Alpaca to only sell a portion.
      // Alpaca creates a market sell order behind the scenes.
      const closeOrder = await alpaca.trading.positions.close('AAPL', {
        qty: halfQty,
      })
      console.log(`  Closed ${halfQty} shares of AAPL`)
      console.log(`  Close Order ID: ${closeOrder.id}`)
      console.log(`  Order Status:   ${closeOrder.status}`)
    } else {
      console.log('  Only 1 share held — cannot split further')
    }
  } catch {
    // If there is no AAPL position, we cannot close it.
    console.log('  No AAPL position to close')
  }
  console.log()

  // -----------------------------------------------------------------------
  // Step 5: Close all positions (liquidate portfolio)
  // -----------------------------------------------------------------------
  // `positions.closeAll()` liquidates every open position by creating
  // market sell orders for each one. The `cancel_orders` flag also
  // cancels any pending open orders, preventing new positions from
  // being opened while you are trying to close everything.
  //
  // WARNING: In a live account, this sells ALL your holdings at market
  // price. Use with extreme caution outside of paper trading.
  console.log('=== Closing All Positions ===')
  const closedOrders = await alpaca.trading.positions.closeAll({
    cancel_orders: true,
  })

  // The response is an array of `PositionClosedResponse` objects, one per
  // position. Each has `symbol`, `status` (HTTP status code as a string,
  // e.g. "200"), and `body` (the actual Order object).
  console.log(`  Submitted ${closedOrders.length} close order(s)`)
  for (const result of closedOrders) {
    // Access the actual order details via `result.body`.
    const orderStatus = result.body?.status ?? 'unknown'
    console.log(`  - ${result.symbol}: ${orderStatus}`)
  }
}

// Run the main function and catch any errors.
// Common errors: 404 when the position does not exist, 403 for
// insufficient permissions.
main().catch(console.error)
