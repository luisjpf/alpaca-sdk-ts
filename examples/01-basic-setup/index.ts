/**
 * Example 01 - Basic Setup
 *
 * This is the simplest possible example of using the Alpaca SDK.
 * It shows how to create a client, fetch account details, and check
 * the market clock. This is a great starting point for any Alpaca project.
 */

// Import the unified client factory from the SDK.
// `createAlpacaClient` gives you access to all Alpaca APIs (trading, market data,
// broker, and streaming) through a single object.
import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

async function main() {
  // -----------------------------------------------------------------------
  // Step 1: Create the Alpaca client
  // -----------------------------------------------------------------------
  // The client needs your API key and secret to authenticate requests.
  // We read these from environment variables so credentials are never
  // hard-coded in source files — this is a security best practice.
  //
  // The `paper` option (defaults to true) tells the SDK to connect to
  // Alpaca's paper trading environment, which uses fake money so you
  // can test strategies without risking real funds.
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
  // Step 2: Fetch account information
  // -----------------------------------------------------------------------
  // The `trading.account.get()` method returns your account profile,
  // including balances, margin info, trading status, and more.
  // This is the first thing you should call to verify your credentials
  // are working and to understand your current financial state.
  const account = await alpaca.trading.account.get()

  // Print a nicely formatted summary of the most important account fields.
  // `equity` is the total value of cash + positions.
  // `buying_power` is how much you can spend on new orders (varies by margin type).
  // `cash` is the settled cash balance.
  // `status` should be "ACTIVE" for a functioning account.
  console.log('=== Account Information ===')
  console.log(`  Account ID:    ${account.id}`)
  console.log(`  Status:        ${account.status}`)
  console.log(`  Equity:        $${account.equity}`)
  console.log(`  Cash:          $${account.cash}`)
  console.log(`  Buying Power:  $${account.buying_power}`)
  console.log(`  Currency:      ${account.currency}`)
  console.log()

  // -----------------------------------------------------------------------
  // Step 3: Check the market clock
  // -----------------------------------------------------------------------
  // The market clock tells you whether the US stock market is currently open,
  // and provides the next open/close timestamps. This is critical for
  // deciding when to place orders — market orders will fail if the market
  // is closed, while limit orders will queue until market open.
  const clock = await alpaca.trading.clock.get()

  // `is_open` is a boolean: true when the market is in regular trading hours.
  // `next_open` and `next_close` are ISO 8601 timestamps in the US/Eastern timezone.
  // `timestamp` is the current server time so you can see any clock drift.
  console.log('=== Market Clock ===')
  console.log(`  Server Time:   ${clock.timestamp}`)
  console.log(`  Market Open:   ${clock.is_open ? 'YES' : 'NO'}`)
  console.log(`  Next Open:     ${clock.next_open}`)
  console.log(`  Next Close:    ${clock.next_close}`)
}

// Run the main function and catch any errors at the top level.
// Common errors include invalid API keys (401), rate limiting (429),
// or network issues. The SDK throws typed errors you can inspect.
main().catch(console.error)
