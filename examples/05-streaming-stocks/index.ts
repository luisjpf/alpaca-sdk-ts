/**
 * Example 05 - Streaming Stock Data
 *
 * This example shows how to receive real-time stock market data via WebSocket.
 * Unlike the REST API (Example 04) which returns point-in-time snapshots,
 * streaming gives you a continuous feed of every trade, quote change, and
 * aggregated bar as they happen — essential for live dashboards, real-time
 * alerts, and algorithmic trading.
 */

// Import `createStockStream` directly instead of through the unified client.
// This is the recommended approach for streaming because you get full control
// over the stream configuration (feed type, etc.) without needing the
// unified client overhead.
import { createStockStream } from '@luisjpf/alpaca-sdk'

function main() {
  // -----------------------------------------------------------------------
  // Step 1: Create the stock stream with IEX feed
  // -----------------------------------------------------------------------
  // The IEX feed is free and available on Alpaca's Basic plan. It provides
  // data from the Investors Exchange, which handles about 2-3% of US stock
  // volume. For production use with full market coverage, upgrade to the
  // SIP feed ('sip'), which consolidates data from all US exchanges.
  //
  // The `paper` flag does NOT affect market data — you get real market data
  // regardless of whether you are in paper or live mode. Paper mode only
  // affects trading operations.
  const stream = createStockStream({
    keyId: process.env.ALPACA_KEY_ID ?? '',
    secretKey: process.env.ALPACA_SECRET_KEY ?? '',
    paper: true,
    feed: 'iex',
  })

  // -----------------------------------------------------------------------
  // Step 2: Register event handlers BEFORE connecting
  // -----------------------------------------------------------------------
  // It is important to register all handlers before calling `connect()`.
  // If you connect first, you might miss early events that arrive before
  // the handlers are in place. The SDK queues subscriptions internally
  // until the connection is authenticated, but registering handlers
  // first is still the safest pattern.

  // -- Connection lifecycle events --

  // `onConnect` fires once the WebSocket is connected AND authenticated.
  // At this point, it is safe to subscribe to data channels.
  stream.onConnect(() => {
    console.log('[Connected] Successfully connected and authenticated')
    console.log('[Connected] Subscribing to market data channels...')
    console.log()
  })

  // `onDisconnect` fires when the WebSocket closes, whether intentionally
  // (you called disconnect()) or due to a network error.
  stream.onDisconnect(() => {
    console.log('[Disconnected] Stream connection closed')
  })

  // `onError` fires for any errors during the stream lifecycle — failed
  // authentication, network drops, malformed messages, etc.
  stream.onError((error) => {
    console.error('[Error]', error.message)
  })

  // -- Market data events --

  // `onTrade` fires for every executed trade. A trade means shares actually
  // changed hands at a specific price. High-volume stocks like AAPL can
  // generate thousands of trades per second during market hours.
  //
  // Trade fields:
  //   S = symbol, p = price, s = size (shares), t = timestamp,
  //   x = exchange code, c = trade conditions
  stream.onTrade((trade) => {
    console.log(
      `[Trade] ${trade.S} | ` +
        `Price: $${trade.p} | ` +
        `Size: ${trade.s} shares | ` +
        `Time: ${trade.t}`
    )
  })

  // `onQuote` fires whenever the best bid or ask price changes. Quotes
  // update much more frequently than trades — they reflect the order book
  // shifting even when no trades execute. This is useful for tracking
  // the bid-ask spread and market sentiment in real time.
  //
  // Quote fields:
  //   S = symbol, bp = bid price, bs = bid size,
  //   ap = ask price, as = ask size, t = timestamp
  stream.onQuote((quote) => {
    const spread = (quote.ap - quote.bp).toFixed(4)
    console.log(
      `[Quote] ${quote.S} | ` +
        `Bid: $${quote.bp} (${quote.bs}) | ` +
        `Ask: $${quote.ap} (${quote.as}) | ` +
        `Spread: $${spread}`
    )
  })

  // `onBar` fires when an aggregated bar (candlestick) completes. By
  // default, bars are 1-minute intervals. Each bar summarizes all trades
  // within that minute into OHLCV data. Bars fire much less frequently
  // than trades or quotes, making them useful for lower-frequency strategies.
  //
  // Bar fields:
  //   S = symbol, o = open, h = high, l = low, c = close,
  //   v = volume, t = timestamp, n = trade count, vw = VWAP
  stream.onBar((bar) => {
    console.log(
      `[Bar]   ${bar.S} | ` +
        `O: $${bar.o} H: $${bar.h} L: $${bar.l} C: $${bar.c} | ` +
        `Vol: ${bar.v} | ` +
        `Trades: ${bar.n}`
    )
  })

  // -----------------------------------------------------------------------
  // Step 3: Connect to the WebSocket server
  // -----------------------------------------------------------------------
  // `connect()` initiates the WebSocket handshake. Once connected, the SDK
  // automatically sends your credentials for authentication. After auth
  // succeeds, the `onConnect` handler fires and any queued subscriptions
  // are sent.
  stream.connect()

  // -----------------------------------------------------------------------
  // Step 4: Subscribe to data channels
  // -----------------------------------------------------------------------
  // You can call subscribe methods before or after `connect()`. If called
  // before authentication completes, the SDK queues the subscription and
  // sends it automatically once authenticated.

  // Subscribe to trades and quotes for three popular tech stocks.
  // Each subscription is per-channel (trades, quotes, bars) and per-symbol.
  stream.subscribeForTrades(['AAPL', 'MSFT', 'GOOGL'])
  stream.subscribeForQuotes(['AAPL', 'MSFT', 'GOOGL'])

  // Subscribe to 1-minute bars for AAPL only. You do not have to subscribe
  // to every channel for every symbol — pick only what you need to reduce
  // bandwidth and processing overhead.
  stream.subscribeForBars(['AAPL'])

  // -----------------------------------------------------------------------
  // Step 5: Graceful shutdown on SIGINT (Ctrl+C)
  // -----------------------------------------------------------------------
  // Without this handler, pressing Ctrl+C would abruptly kill the process,
  // potentially leaving the WebSocket in a dirty state. By catching SIGINT,
  // we cleanly disconnect (sends a close frame to the server) and then
  // exit the process normally.
  process.on('SIGINT', () => {
    console.log()
    console.log('Shutting down gracefully...')
    stream.disconnect()
    process.exit(0)
  })

  // Let the user know the stream is running and waiting for data.
  // During market hours, you will see trades and quotes flowing in.
  // Outside market hours, the stream stays connected but receives no data.
  console.log('Press Ctrl+C to stop streaming...')
  console.log('(Data will appear during market hours, 9:30 AM - 4:00 PM ET)')
  console.log()
}

// Run the main function. Once the stream is running, errors are handled
// by the onError callback.
main()
