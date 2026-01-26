/**
 * Crypto market data streaming
 *
 * Provides real-time crypto trades, quotes, and bars via WebSocket.
 */

import { BaseStream } from './base-stream'
import type {
  CryptoStreamConfig,
  CryptoLocation,
  Trade,
  Quote,
  Bar,
  MarketDataAuth,
  MarketDataSubscription,
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
  private subscribedTrades = new Set<string>()
  private subscribedQuotes = new Set<string>()
  private subscribedBars = new Set<string>()

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
    const type = message.T as string

    switch (type) {
      case 't':
        this.emit('trade', message as unknown as Trade)
        break
      case 'q':
        this.emit('quote', message as unknown as Quote)
        break
      case 'b':
        this.emit('bar', message as unknown as Bar)
        break
    }
  }

  subscribeForTrades(symbols: string[]): void {
    this.queueOrSend(() => {
      const newSymbols = symbols.filter((s) => !this.subscribedTrades.has(s))
      if (newSymbols.length === 0) return

      for (const symbol of newSymbols) {
        this.subscribedTrades.add(symbol)
      }

      const message: MarketDataSubscription = {
        action: 'subscribe',
        trades: newSymbols,
      }
      this.send(message)
    })
  }

  subscribeForQuotes(symbols: string[]): void {
    this.queueOrSend(() => {
      const newSymbols = symbols.filter((s) => !this.subscribedQuotes.has(s))
      if (newSymbols.length === 0) return

      for (const symbol of newSymbols) {
        this.subscribedQuotes.add(symbol)
      }

      const message: MarketDataSubscription = {
        action: 'subscribe',
        quotes: newSymbols,
      }
      this.send(message)
    })
  }

  subscribeForBars(symbols: string[]): void {
    this.queueOrSend(() => {
      const newSymbols = symbols.filter((s) => !this.subscribedBars.has(s))
      if (newSymbols.length === 0) return

      for (const symbol of newSymbols) {
        this.subscribedBars.add(symbol)
      }

      const message: MarketDataSubscription = {
        action: 'subscribe',
        bars: newSymbols,
      }
      this.send(message)
    })
  }

  unsubscribeFromTrades(symbols: string[]): void {
    this.queueOrSend(() => {
      const existingSymbols = symbols.filter((s) => this.subscribedTrades.has(s))
      if (existingSymbols.length === 0) return

      for (const symbol of existingSymbols) {
        this.subscribedTrades.delete(symbol)
      }

      const message: MarketDataSubscription = {
        action: 'unsubscribe',
        trades: existingSymbols,
      }
      this.send(message)
    })
  }

  unsubscribeFromQuotes(symbols: string[]): void {
    this.queueOrSend(() => {
      const existingSymbols = symbols.filter((s) => this.subscribedQuotes.has(s))
      if (existingSymbols.length === 0) return

      for (const symbol of existingSymbols) {
        this.subscribedQuotes.delete(symbol)
      }

      const message: MarketDataSubscription = {
        action: 'unsubscribe',
        quotes: existingSymbols,
      }
      this.send(message)
    })
  }

  unsubscribeFromBars(symbols: string[]): void {
    this.queueOrSend(() => {
      const existingSymbols = symbols.filter((s) => this.subscribedBars.has(s))
      if (existingSymbols.length === 0) return

      for (const symbol of existingSymbols) {
        this.subscribedBars.delete(symbol)
      }

      const message: MarketDataSubscription = {
        action: 'unsubscribe',
        bars: existingSymbols,
      }
      this.send(message)
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
