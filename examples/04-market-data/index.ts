/**
 * Example 04 - Market Data
 *
 * This example demonstrates how to use Alpaca's Market Data API to fetch
 * historical bars (candlesticks), real-time quotes, multi-symbol snapshots,
 * and the latest trade. All data comes from the REST API — for real-time
 * streaming, see Examples 05 and 06.
 */

// Import the unified client factory. Market data methods live under
// `alpaca.marketData.stocks`, `alpaca.marketData.crypto`, etc.
import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

async function main() {
  // -----------------------------------------------------------------------
  // Step 1: Create the Alpaca client
  // -----------------------------------------------------------------------
  // We only need the `marketData` namespace in this example, but we still
  // create the full unified client for simplicity. The other namespaces
  // (trading, broker, streams) are available but unused here.
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
  // Step 2: Get historical daily bars for AAPL (last 30 days)
  // -----------------------------------------------------------------------
  // Bars are OHLCV candlesticks — each bar summarizes price and volume
  // over a time interval (here, 1 day). Bars are the foundation of
  // most technical analysis and charting.
  //
  // `timeframe` specifies the bar size. Common values:
  //   '1Min', '5Min', '15Min', '1Hour', '1Day', '1Week', '1Month'
  //
  // `start` and `end` use ISO 8601 date strings. We compute 30 days
  // ago dynamically so this example always returns recent data.
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  console.log('=== AAPL Historical Daily Bars (Last 30 Days) ===')
  const barsResponse = await alpaca.marketData.stocks.getSymbolBars('AAPL', {
    timeframe: '1Day',
    start: thirtyDaysAgo.toISOString(),
  })

  // The response contains a `bars` array with OHLCV data for each day.
  // `o` = open, `h` = high, `l` = low, `c` = close, `v` = volume,
  // `t` = timestamp, `n` = number of trades, `vw` = volume-weighted avg price.
  const bars = barsResponse.bars ?? []
  for (const bar of bars) {
    // Format each bar as a readable line showing the date and OHLCV values.
    // The timestamp `t` is an ISO string; we slice to show just the date part.
    const date = bar.t.slice(0, 10)
    console.log(
      `  ${date} | ` +
        `O: $${bar.o} | H: $${bar.h} | L: $${bar.l} | C: $${bar.c} | ` +
        `Vol: ${bar.v}`
    )
  }
  console.log()

  // -----------------------------------------------------------------------
  // Step 3: Get the latest quote for AAPL (bid/ask spread)
  // -----------------------------------------------------------------------
  // A quote shows the current best bid and ask prices. The "spread" is the
  // difference between ask and bid — a tight spread means high liquidity,
  // while a wide spread suggests lower liquidity or volatility.
  //
  // `bp` = bid price (highest price a buyer is willing to pay)
  // `ap` = ask price (lowest price a seller is willing to accept)
  // `bs` = bid size (number of shares at the bid price)
  // `as` = ask size (number of shares at the ask price)
  console.log('=== AAPL Latest Quote ===')
  const quoteResp = await alpaca.marketData.stocks.getLatestQuote('AAPL')

  // The response wraps the quote data in a `quote` property alongside `symbol`.
  const q = quoteResp.quote
  const bidPrice = q.bp
  const askPrice = q.ap
  const spread = (askPrice - bidPrice).toFixed(4)

  console.log(`  Bid:    $${q.bp} (size: ${q.bs})`)
  console.log(`  Ask:    $${q.ap} (size: ${q.as})`)
  console.log(`  Spread: $${spread}`)
  console.log()

  // -----------------------------------------------------------------------
  // Step 4: Get snapshots for multiple symbols
  // -----------------------------------------------------------------------
  // A snapshot is a convenient all-in-one view that bundles together
  // the latest trade, latest quote, minute bar, daily bar, and previous
  // daily bar for each requested symbol. This avoids making multiple
  // separate API calls when you need a comprehensive market overview.
  console.log('=== Snapshots for AAPL, MSFT, GOOGL ===')
  const snapshots = await alpaca.marketData.stocks.getSnapshots({
    symbols: 'AAPL,MSFT,GOOGL',
  })

  // The response is a map of symbol -> snapshot object.
  // Each snapshot contains `latestTrade`, `dailyBar`, `prevDailyBar`, etc.
  for (const [symbol, snapshot] of Object.entries(snapshots)) {
    // Type-safe access to the snapshot fields.
    // `latestTrade.p` is the price of the most recent trade.
    // `dailyBar` is today's OHLCV bar (updates throughout the day).
    // `prevDailyBar` is yesterday's final bar (useful for comparing).
    console.log(`  ${symbol}:`)
    console.log(`    Latest Trade:    $${snapshot.latestTrade?.p}`)
    console.log(
      `    Daily Bar:       O: $${snapshot.dailyBar?.o} | H: $${snapshot.dailyBar?.h} | L: $${snapshot.dailyBar?.l} | C: $${snapshot.dailyBar?.c}`
    )
    console.log(
      `    Prev Daily Bar:  O: $${snapshot.prevDailyBar?.o} | H: $${snapshot.prevDailyBar?.h} | L: $${snapshot.prevDailyBar?.l} | C: $${snapshot.prevDailyBar?.c}`
    )
    console.log()
  }

  // -----------------------------------------------------------------------
  // Step 5: Get the latest trade for MSFT
  // -----------------------------------------------------------------------
  // The latest trade shows the price, size (number of shares), and
  // conditions of the most recently executed trade for a symbol.
  // This gives you the true "last price" — more accurate than a quote
  // because it reflects an actual transaction that occurred.
  //
  // `p` = price the trade executed at
  // `s` = size (number of shares traded)
  // `t` = timestamp of the trade
  // `x` = exchange where the trade occurred
  console.log('=== MSFT Latest Trade ===')
  const tradeResp = await alpaca.marketData.stocks.getLatestTrade('MSFT')

  // The response wraps the trade data in a `trade` property alongside `symbol`.
  const t = tradeResp.trade
  console.log(`  Price:     $${t.p}`)
  console.log(`  Size:      ${t.s} shares`)
  console.log(`  Exchange:  ${t.x}`)
  console.log(`  Timestamp: ${t.t}`)
}

// Run the main function and catch any errors.
// Market data errors are typically 401 (bad credentials), 422 (invalid
// parameters like a bad timeframe), or 429 (rate limit exceeded).
main().catch(console.error)
