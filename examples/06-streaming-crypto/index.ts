/**
 * Example 06 - Streaming Crypto Data
 *
 * This example shows how to receive real-time cryptocurrency market data
 * via WebSocket. Crypto markets trade 24/7, so unlike stocks, you will
 * receive data at any time of day. The streaming API pattern is nearly
 * identical to stock streaming (Example 05) but uses `createCryptoStream`
 * with a location parameter instead of a feed parameter.
 */

// Import `createCryptoStream` directly. Like the stock stream, we import
// the factory function directly rather than going through the unified client.
// This keeps the import lightweight and makes the crypto-specific config
// (location) easy to set.
import { createCryptoStream } from '@luisjpf/alpaca-sdk'

/**
 * Format a crypto price for display. Crypto prices vary wildly in magnitude
 * (BTC is ~$60,000 while some altcoins are fractions of a cent), so we use
 * different decimal precision depending on the price level.
 */
function formatPrice(price: number): string {
  // For high-value assets like BTC, 2 decimal places is sufficient.
  // For lower-value assets, we show more decimals for precision.
  if (price >= 100) {
    return `$${price.toFixed(2)}`
  } else if (price >= 1) {
    return `$${price.toFixed(4)}`
  } else {
    return `$${price.toFixed(6)}`
  }
}

function main() {
  // -----------------------------------------------------------------------
  // Step 1: Create the crypto stream for the US location
  // -----------------------------------------------------------------------
  // The `location` parameter determines which crypto exchange data source
  // to connect to:
  //   - 'us'   — Alpaca's US crypto exchange (default, available to all)
  //   - 'us-1' — Kraken US (limited to 23 states)
  //   - 'eu-1' — Kraken EU (for EU-based accounts)
  //
  // Unlike stock feeds where IEX is free and SIP is paid, all crypto
  // locations provide full data. The choice depends on your geographic
  // region and regulatory requirements.
  const stream = createCryptoStream({
    keyId: process.env.ALPACA_KEY_ID ?? '',
    secretKey: process.env.ALPACA_SECRET_KEY ?? '',
    paper: true,
    location: 'us',
  })

  // -----------------------------------------------------------------------
  // Step 2: Register event handlers
  // -----------------------------------------------------------------------
  // The event handler pattern is identical to stock streaming. Register
  // all handlers before calling connect() to ensure no early events
  // are missed.

  // -- Connection lifecycle events --

  stream.onConnect(() => {
    console.log('[Connected] Crypto stream authenticated successfully')
    console.log('[Connected] Subscribing to BTC/USD and ETH/USD...')
    console.log()
  })

  stream.onDisconnect(() => {
    console.log('[Disconnected] Crypto stream closed')
  })

  stream.onError((error) => {
    console.error('[Error]', error.message)
  })

  // -- Market data events --

  // `onTrade` fires for every executed crypto trade. Crypto trades
  // happen 24/7 with varying frequency — BTC/USD typically trades
  // many times per minute, while less popular pairs may be quieter.
  //
  // The trade object has the same structure as stock trades:
  //   S = symbol (e.g., 'BTC/USD'), p = price, s = size, t = timestamp
  stream.onTrade((trade) => {
    console.log(
      `[Trade] ${trade.S} | ` +
        `Price: ${formatPrice(trade.p)} | ` +
        `Size: ${trade.s} | ` +
        `Time: ${trade.t}`
    )
  })

  // `onBar` fires when a 1-minute aggregated bar completes. Bars
  // are great for building real-time candlestick charts or tracking
  // price trends without processing every individual trade.
  //
  // Bar fields are the same as stock bars:
  //   S = symbol, o = open, h = high, l = low, c = close,
  //   v = volume, t = timestamp, n = trade count, vw = VWAP
  stream.onBar((bar) => {
    console.log(
      `[Bar]   ${bar.S} | ` +
        `O: ${formatPrice(bar.o)} ` +
        `H: ${formatPrice(bar.h)} ` +
        `L: ${formatPrice(bar.l)} ` +
        `C: ${formatPrice(bar.c)} | ` +
        `Vol: ${bar.v} | ` +
        `Trades: ${bar.n}`
    )
  })

  // -----------------------------------------------------------------------
  // Step 3: Connect and subscribe
  // -----------------------------------------------------------------------
  // Connect initiates the WebSocket handshake and authenticates.
  // Subscriptions can be queued before or after connect — the SDK
  // handles the ordering internally.
  stream.connect()

  // Subscribe to trades for both BTC/USD and ETH/USD. These are the
  // two most liquid cryptocurrency pairs, so you should see frequent
  // updates even outside of US market hours.
  stream.subscribeForTrades(['BTC/USD', 'ETH/USD'])

  // Subscribe to bars for both symbols. You will see one bar per
  // symbol per minute, giving a nice summary of recent activity.
  stream.subscribeForBars(['BTC/USD', 'ETH/USD'])

  // -----------------------------------------------------------------------
  // Step 4: Graceful shutdown on SIGINT
  // -----------------------------------------------------------------------
  // Clean disconnection ensures the WebSocket close handshake completes
  // properly and resources are freed on both client and server side.
  process.on('SIGINT', () => {
    console.log()
    console.log('Shutting down gracefully...')
    stream.disconnect()
    process.exit(0)
  })

  // Crypto markets are always open, so you should see data immediately
  // after connecting — no need to wait for market hours like with stocks.
  console.log('Press Ctrl+C to stop streaming...')
  console.log('(Crypto markets are 24/7 — data should arrive immediately)')
  console.log()
}

// Run the main function. Runtime stream errors are handled by the
// onError callback above.
main()
