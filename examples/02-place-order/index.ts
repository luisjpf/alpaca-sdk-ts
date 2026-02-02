/**
 * Example 02 - Place Orders
 *
 * This example walks through placing three different order types on Alpaca:
 * a market order, a limit order, and a stop-limit order. It then lists
 * recent orders to check their status, and finally cancels all open orders
 * to clean up. All operations happen in paper trading mode (no real money).
 */

// Import the unified client factory. Through `alpaca.trading.orders` we get
// full access to Alpaca's order management API.
import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

async function main() {
  // -----------------------------------------------------------------------
  // Step 1: Create the Alpaca client
  // -----------------------------------------------------------------------
  // Paper mode is the default, but we set it explicitly here to be clear.
  // Paper trading behaves identically to live trading except it uses
  // simulated money, making it safe for testing order logic.
  const alpaca = createAlpacaClient({
    keyId: process.env.ALPACA_KEY_ID ?? '',
    secretKey: process.env.ALPACA_SECRET_KEY ?? '',
    paper: true,
  })

  // -----------------------------------------------------------------------
  // Step 2: Place a market buy order for 1 share of AAPL
  // -----------------------------------------------------------------------
  // A market order executes immediately at the best available price.
  // This is the simplest order type — you are saying "buy now at whatever
  // the current price is." The downside is you have no control over the
  // exact fill price, especially in fast-moving markets.
  //
  // `time_in_force: 'day'` means the order is valid only for the current
  // trading day. If the market is closed, it will execute at the next open.
  console.log('=== Placing Market Order (AAPL) ===')
  const marketOrder = await alpaca.trading.orders.create({
    symbol: 'AAPL',
    qty: '1',
    side: 'buy',
    type: 'market',
    time_in_force: 'day',
  })

  // The API returns the full order object including its server-assigned ID,
  // status (usually 'accepted' or 'new'), and timestamps.
  console.log(`  Order ID:      ${marketOrder.id}`)
  console.log(`  Symbol:        ${marketOrder.symbol}`)
  console.log(`  Type:          ${marketOrder.type}`)
  console.log(`  Side:          ${marketOrder.side}`)
  console.log(`  Qty:           ${marketOrder.qty}`)
  console.log(`  Status:        ${marketOrder.status}`)
  console.log()

  // -----------------------------------------------------------------------
  // Step 3: Place a limit buy order for 1 share of MSFT
  // -----------------------------------------------------------------------
  // A limit order will only execute at the specified price or better.
  // Here we set the limit price to $350.00 — the order will only fill
  // if MSFT's price drops to $350 or below. If the current price is
  // already at or below $350, it fills immediately like a market order.
  //
  // `time_in_force: 'gtc'` (Good Till Cancelled) means this order stays
  // active across multiple trading days until it fills or you cancel it.
  // This is useful for setting a target entry price and waiting.
  console.log('=== Placing Limit Order (MSFT) ===')
  const limitOrder = await alpaca.trading.orders.create({
    symbol: 'MSFT',
    qty: '1',
    side: 'buy',
    type: 'limit',
    time_in_force: 'gtc',
    limit_price: '350.00',
  })

  console.log(`  Order ID:      ${limitOrder.id}`)
  console.log(`  Symbol:        ${limitOrder.symbol}`)
  console.log(`  Type:          ${limitOrder.type}`)
  console.log(`  Limit Price:   $${limitOrder.limit_price}`)
  console.log(`  Status:        ${limitOrder.status}`)
  console.log()

  // -----------------------------------------------------------------------
  // Step 4: Place a stop-limit sell order for GOOGL
  // -----------------------------------------------------------------------
  // A stop-limit order is a two-stage order:
  //   1. When the stock price drops to the `stop_price` ($150), the order
  //      becomes active (triggers).
  //   2. Once triggered, it becomes a limit order at `limit_price` ($149).
  //      It will only sell at $149 or higher.
  //
  // This is commonly used as a protective stop-loss — you want to sell if
  // the price falls to a certain level, but you also set a floor to avoid
  // selling at a terrible price during a flash crash. The risk is that if
  // the price gaps below your limit, the order may not fill at all.
  console.log('=== Placing Stop-Limit Order (GOOGL) ===')
  const stopLimitOrder = await alpaca.trading.orders.create({
    symbol: 'GOOGL',
    qty: '1',
    side: 'sell',
    type: 'stop_limit',
    time_in_force: 'gtc',
    stop_price: '150.00',
    limit_price: '149.00',
  })

  console.log(`  Order ID:      ${stopLimitOrder.id}`)
  console.log(`  Symbol:        ${stopLimitOrder.symbol}`)
  console.log(`  Type:          ${stopLimitOrder.type}`)
  console.log(`  Stop Price:    $${stopLimitOrder.stop_price}`)
  console.log(`  Limit Price:   $${stopLimitOrder.limit_price}`)
  console.log(`  Status:        ${stopLimitOrder.status}`)
  console.log()

  // -----------------------------------------------------------------------
  // Step 5: List recent orders to see their current status
  // -----------------------------------------------------------------------
  // Fetching all orders lets us verify what was submitted and track
  // whether orders have been filled, partially filled, or are still open.
  // By default, this returns orders from the current day.
  // The `status` filter can be 'open', 'closed', or 'all'.
  // The `limit` parameter controls how many orders to return (max 500).
  console.log('=== Recent Orders ===')
  const orders = await alpaca.trading.orders.list({
    status: 'all',
    limit: 10,
  })

  // Print each order with its key details. The `filled_avg_price` shows
  // the actual execution price for filled orders (null for unfilled ones).
  for (const order of orders) {
    console.log(
      `  ${order.symbol} | ${order.side} ${order.type} | ` +
        `qty: ${order.qty} | status: ${order.status} | ` +
        `filled avg: ${order.filled_avg_price ?? 'N/A'}`
    )
  }
  console.log()

  // -----------------------------------------------------------------------
  // Step 6: Cancel all open orders (cleanup)
  // -----------------------------------------------------------------------
  // This is a convenience method that cancels every open order at once.
  // It is useful for cleaning up after testing, or as an emergency
  // "kill switch" to prevent any pending orders from executing.
  // In production, you would typically cancel orders individually.
  console.log('=== Cancelling All Open Orders ===')
  const cancelled = await alpaca.trading.orders.cancelAll()
  console.log(`  Cancelled ${cancelled.length} order(s)`)
}

// Run the main function and catch any errors at the top level.
// Common errors: insufficient buying power (403), symbol not found (404),
// or invalid order parameters (422).
main().catch(console.error)
