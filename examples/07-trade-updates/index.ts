/**
 * Example 07 - Trade Updates Streaming
 *
 * This example shows how to receive real-time order status updates via WebSocket.
 * Trade updates are critical for any trading application — they tell you when
 * orders are filled, canceled, rejected, or go through any other state change.
 *
 * Unlike polling the orders API, WebSocket streaming gives you instant
 * notifications, which is essential for time-sensitive trading strategies.
 */

import { createAlpacaClient, createTradeUpdatesStream } from '@luisjpf/alpaca-sdk'

async function main() {
  // ---------------------------------------------------------------------------
  // Step 1: Read API credentials from environment variables
  // ---------------------------------------------------------------------------
  // These are the same credentials used across all examples. They authenticate
  // you with Alpaca's API. Paper trading keys let you test without real money.
  const keyId = process.env.ALPACA_KEY_ID
  const secretKey = process.env.ALPACA_SECRET_KEY

  // Validate that credentials are present before proceeding. Without them,
  // the WebSocket connection will fail during the authentication handshake.
  if (!keyId || !secretKey) {
    console.error('Please set ALPACA_KEY_ID and ALPACA_SECRET_KEY environment variables')
    process.exit(1)
  }

  // ---------------------------------------------------------------------------
  // Step 2: Create the trade updates WebSocket stream
  // ---------------------------------------------------------------------------
  // createTradeUpdatesStream creates a WebSocket client specifically for
  // trade/order status updates. This is separate from market data streams
  // (stocks, crypto) because it uses a different WebSocket endpoint and
  // protocol — the trading stream at wss://paper-api.alpaca.markets/stream.
  //
  // The stream handles authentication, subscription, and automatic reconnection
  // with exponential backoff internally.
  const stream = createTradeUpdatesStream({
    keyId,
    secretKey,
    paper: true, // Use paper trading WebSocket endpoint (default)
  })

  // ---------------------------------------------------------------------------
  // Step 3: Register event handlers BEFORE connecting
  // ---------------------------------------------------------------------------
  // It's important to register handlers before calling connect() to avoid
  // missing any events that fire immediately after connection (like the
  // initial authentication success).

  // onConnect fires when the WebSocket is authenticated and ready to receive
  // trade updates. This is a good place to log that the stream is active.
  stream.onConnect(() => {
    console.log('[Stream] Connected and authenticated successfully')
    console.log('[Stream] Listening for trade updates...')
    console.log('[Stream] (Place an order to see updates, or wait for existing orders)')
    console.log()
  })

  // onTradeUpdate fires every time an order event occurs. The update
  // object contains the event type, the full order object, and optionally
  // the fill price and quantity (for fill/partial_fill events).
  stream.onTradeUpdate((update) => {
    // The event field tells you what happened to the order. Common values:
    // 'new', 'fill', 'partial_fill', 'canceled', 'expired', 'rejected'
    console.log(`[Trade Update] Event: ${update.event}`)

    // The order field contains the full order object with all its details.
    // We cast it to a record to safely access its properties since the
    // streaming type uses `unknown` for maximum flexibility.
    const order = update.order as Record<string, unknown>
    if (order) {
      console.log(`  Order ID:    ${order.id}`)
      console.log(`  Symbol:      ${order.symbol}`)
      console.log(`  Side:        ${order.side}`)
      console.log(`  Type:        ${order.type}`)
      console.log(`  Qty:         ${order.qty}`)
      console.log(`  Status:      ${order.status}`)
    }

    // For fill and partial_fill events, the update includes the execution
    // price and quantity. These are critical for tracking your actual
    // execution prices (which may differ from limit prices).
    if (update.price) {
      console.log(`  Fill Price:  $${update.price}`)
    }
    if (update.qty) {
      console.log(`  Fill Qty:    ${update.qty}`)
    }
    if (update.timestamp) {
      console.log(`  Timestamp:   ${update.timestamp}`)
    }

    console.log() // Blank line between updates for readability
  })

  // onError fires when a WebSocket error occurs. This could be a network
  // issue, authentication failure, or message parsing error. The stream
  // will automatically attempt to reconnect after most errors.
  stream.onError((error: Error) => {
    console.error(`[Stream] Error: ${error.message}`)
  })

  // onDisconnect fires when the WebSocket connection is lost. If the
  // disconnection was unexpected (not caused by calling disconnect()),
  // the stream will automatically attempt to reconnect with exponential
  // backoff (starting at 1 second, up to 30 seconds between attempts).
  stream.onDisconnect(() => {
    console.log('[Stream] Disconnected from WebSocket')
  })

  // ---------------------------------------------------------------------------
  // Step 4: Connect and subscribe to trade updates
  // ---------------------------------------------------------------------------
  // connect() initiates the WebSocket connection and authenticates.
  // subscribe() tells the server we want to receive trade_updates events.
  // If subscribe() is called before the connection is ready, it will
  // automatically queue and send the subscription after authentication.
  stream.connect()
  stream.subscribe()

  console.log('[Stream] Connecting to Alpaca trade updates WebSocket...')
  console.log()

  // ---------------------------------------------------------------------------
  // Step 5 (Optional): Place a test order to trigger a trade update
  // ---------------------------------------------------------------------------
  // To see the trade updates in action, we'll place a small market order.
  // Market orders during market hours typically fill immediately, generating
  // 'new' and 'fill' events. During off-hours, you'll see 'new' and
  // possibly 'accepted' events.
  //
  // We create a separate trading client for this purpose since the stream
  // client only handles WebSocket communication.
  const alpaca = createAlpacaClient({ keyId, secretKey, paper: true })

  // Wait a few seconds for the WebSocket to connect and authenticate
  // before placing the test order. This ensures we don't miss the events.
  console.log('[Test] Waiting 3 seconds for stream to connect before placing test order...')
  await new Promise((resolve) => setTimeout(resolve, 3000))

  try {
    // Place a market order for 1 share of AAPL. This is a paper trading
    // order so no real money is involved. The 'day' time-in-force means
    // the order will expire at market close if not filled.
    const order = await alpaca.trading.orders.create({
      symbol: 'AAPL',
      qty: '1',
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    })

    console.log(`[Test] Placed test order: ${order.id}`)
    console.log('[Test] Watch for trade update events above!')
    console.log()
  } catch (error) {
    // The order might fail if the market is closed or if there's
    // insufficient buying power. This is fine — the stream will
    // still be listening for updates from any other orders.
    console.log(
      `[Test] Could not place test order: ${error instanceof Error ? error.message : String(error)}`
    )
    console.log('[Test] The stream is still listening for updates from other orders.')
    console.log()
  }

  // ---------------------------------------------------------------------------
  // Step 6: Graceful shutdown on SIGINT (Ctrl+C)
  // ---------------------------------------------------------------------------
  // When the user presses Ctrl+C, we want to cleanly disconnect the WebSocket
  // before exiting. This sends a proper close frame to the server and prevents
  // the connection from lingering.
  process.on('SIGINT', () => {
    console.log()
    console.log('[Stream] Shutting down gracefully...')

    // disconnect() closes the WebSocket and stops automatic reconnection.
    // Without this, the stream would keep trying to reconnect.
    stream.disconnect()

    console.log('[Stream] Disconnected. Goodbye!')
    process.exit(0)
  })

  // ---------------------------------------------------------------------------
  // Step 7: Keep the process alive
  // ---------------------------------------------------------------------------
  // Node.js will exit when there's nothing left to do. We keep the process
  // running by creating a long interval. The WebSocket connection itself
  // also keeps the event loop active, but this is a safety net.
  //
  // In a real application, your main event loop or web server framework
  // would keep the process alive naturally.
  setInterval(() => {
    // Periodic heartbeat to confirm the stream is still active.
    // In production, you might check stream.isConnected() here and
    // take action if the connection has been lost for too long.
    if (stream.isConnected()) {
      console.log('[Heartbeat] Stream is connected and listening...')
    } else {
      console.log('[Heartbeat] Stream is reconnecting...')
    }
  }, 30000) // Log heartbeat every 30 seconds
}

main().catch(console.error)
