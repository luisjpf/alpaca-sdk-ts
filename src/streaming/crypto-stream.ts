/**
 * Crypto market data streaming
 *
 * Provides real-time crypto trades, quotes, and bars via WebSocket.
 */

import { BaseStream } from './base-stream'
import { SubscriptionManager } from './subscription-manager'
import {
  isTrade,
  isQuote,
  isBar,
  type CryptoStreamConfig,
  type CryptoLocation,
  type Trade,
  type Quote,
  type Bar,
  type MarketDataAuth,
} from './types'

/** Base URL for crypto data streaming */
const CRYPTO_STREAM_BASE_URL = 'wss://stream.data.alpaca.markets/v1beta3/crypto'

export interface CryptoStream {
  /** Connect to the WebSocket server */
  connect: () => void
  /** Disconnect from the WebSocket server */
  disconnect: () => void
  /** Check if connected and authenticated */
  isConnected: () => boolean
  /** Subscribe to trades for symbols */
  subscribeForTrades: (symbols: string[]) => void
  /** Subscribe to quotes for symbols */
  subscribeForQuotes: (symbols: string[]) => void
  /** Subscribe to bars for symbols */
  subscribeForBars: (symbols: string[]) => void
  /** Unsubscribe from trades for symbols */
  unsubscribeFromTrades: (symbols: string[]) => void
  /** Unsubscribe from quotes for symbols */
  unsubscribeFromQuotes: (symbols: string[]) => void
  /** Unsubscribe from bars for symbols */
  unsubscribeFromBars: (symbols: string[]) => void
  /** Register a handler for trade events */
  onTrade: (handler: (trade: Trade) => void) => void
  /** Register a handler for quote events */
  onQuote: (handler: (quote: Quote) => void) => void
  /** Register a handler for bar events */
  onBar: (handler: (bar: Bar) => void) => void
  /** Register a handler for connection events */
  onConnect: (handler: () => void) => void
  /** Register a handler for disconnection events */
  onDisconnect: (handler: () => void) => void
  /** Register a handler for error events */
  onError: (handler: (error: Error) => void) => void
}

/**
 * Internal implementation of the crypto stream client.
 */
class CryptoStreamImpl extends BaseStream {
  private location: CryptoLocation
  private subscriptions = new SubscriptionManager()

  constructor(config: CryptoStreamConfig) {
    super(config)
    this.location = config.location ?? 'us'
  }

  protected getUrl(): string {
    return `${CRYPTO_STREAM_BASE_URL}/${this.location}`
  }

  protected getAuthMessage(): MarketDataAuth {
    return {
      action: 'auth',
      key: this.config.keyId,
      secret: this.config.secretKey,
    }
  }

  protected handleMessage(message: Record<string, unknown>): void {
    if (isTrade(message)) {
      this.emit('trade', message)
    } else if (isQuote(message)) {
      this.emit('quote', message)
    } else if (isBar(message)) {
      this.emit('bar', message)
    }
  }

  subscribeForTrades(symbols: string[]): void {
    this.queueOrSend(() => {
      const message = this.subscriptions.subscribe('trades', symbols)
      if (message) this.send(message)
    })
  }

  subscribeForQuotes(symbols: string[]): void {
    this.queueOrSend(() => {
      const message = this.subscriptions.subscribe('quotes', symbols)
      if (message) this.send(message)
    })
  }

  subscribeForBars(symbols: string[]): void {
    this.queueOrSend(() => {
      const message = this.subscriptions.subscribe('bars', symbols)
      if (message) this.send(message)
    })
  }

  unsubscribeFromTrades(symbols: string[]): void {
    this.queueOrSend(() => {
      const message = this.subscriptions.unsubscribe('trades', symbols)
      if (message) this.send(message)
    })
  }

  unsubscribeFromQuotes(symbols: string[]): void {
    this.queueOrSend(() => {
      const message = this.subscriptions.unsubscribe('quotes', symbols)
      if (message) this.send(message)
    })
  }

  unsubscribeFromBars(symbols: string[]): void {
    this.queueOrSend(() => {
      const message = this.subscriptions.unsubscribe('bars', symbols)
      if (message) this.send(message)
    })
  }

  onTrade(handler: (trade: Trade) => void): void {
    this.on('trade', handler)
  }

  onQuote(handler: (quote: Quote) => void): void {
    this.on('quote', handler)
  }

  onBar(handler: (bar: Bar) => void): void {
    this.on('bar', handler)
  }

  onConnect(handler: () => void): void {
    this.on('connected', handler)
  }

  onDisconnect(handler: () => void): void {
    this.on('disconnected', handler)
  }

  onError(handler: (error: Error) => void): void {
    this.on('error', handler)
  }
}

/**
 * Create a crypto data stream client.
 *
 * @param config - Stream configuration including API credentials and location
 * @returns Crypto stream client
 *
 * @example
 * ```typescript
 * const stream = createCryptoStream({
 *   keyId: 'your-api-key',
 *   secretKey: 'your-api-secret',
 *   location: 'us', // 'us' (Alpaca), 'us-1' (Kraken US), 'eu-1' (Kraken EU)
 * })
 *
 * stream.onTrade((trade) => {
 *   console.log(`Trade: ${trade.S} @ ${trade.p}`)
 * })
 *
 * stream.connect()
 * stream.subscribeForTrades(['BTC/USD', 'ETH/USD'])
 * ```
 */
export function createCryptoStream(config: CryptoStreamConfig): CryptoStream {
  const impl = new CryptoStreamImpl(config)

  return {
    connect: () => {
      impl.connect()
    },
    disconnect: () => {
      impl.disconnect()
    },
    isConnected: () => impl.isConnected(),
    subscribeForTrades: (symbols) => {
      impl.subscribeForTrades(symbols)
    },
    subscribeForQuotes: (symbols) => {
      impl.subscribeForQuotes(symbols)
    },
    subscribeForBars: (symbols) => {
      impl.subscribeForBars(symbols)
    },
    unsubscribeFromTrades: (symbols) => {
      impl.unsubscribeFromTrades(symbols)
    },
    unsubscribeFromQuotes: (symbols) => {
      impl.unsubscribeFromQuotes(symbols)
    },
    unsubscribeFromBars: (symbols) => {
      impl.unsubscribeFromBars(symbols)
    },
    onTrade: (handler) => {
      impl.onTrade(handler)
    },
    onQuote: (handler) => {
      impl.onQuote(handler)
    },
    onBar: (handler) => {
      impl.onBar(handler)
    },
    onConnect: (handler) => {
      impl.onConnect(handler)
    },
    onDisconnect: (handler) => {
      impl.onDisconnect(handler)
    },
    onError: (handler) => {
      impl.onError(handler)
    },
  }
}
