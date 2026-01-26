/**
 * Crypto market data streaming
 *
 * @preview WebSocket streaming is currently in development. All methods
 * will throw NotImplementedError until the feature is complete.
 */

import type { StreamConfig, Trade, Quote, Bar } from './types'
import { NotImplementedError } from '@alpaca-sdk/core'

const DOCS_URL = 'https://github.com/alpacahq/alpaca-sdk-ts#streaming-preview'

export interface CryptoStream {
  /** @preview WebSocket streaming is in development */
  connect: () => void
  /** @preview WebSocket streaming is in development */
  disconnect: () => void
  /** @preview WebSocket streaming is in development */
  subscribeForTrades: (symbols: string[]) => void
  /** @preview WebSocket streaming is in development */
  subscribeForQuotes: (symbols: string[]) => void
  /** @preview WebSocket streaming is in development */
  subscribeForBars: (symbols: string[]) => void
  /** @preview WebSocket streaming is in development */
  unsubscribeFromTrades: (symbols: string[]) => void
  /** @preview WebSocket streaming is in development */
  unsubscribeFromQuotes: (symbols: string[]) => void
  /** @preview WebSocket streaming is in development */
  unsubscribeFromBars: (symbols: string[]) => void
  /** @preview WebSocket streaming is in development */
  onTrade: (handler: (trade: Trade) => void) => void
  /** @preview WebSocket streaming is in development */
  onQuote: (handler: (quote: Quote) => void) => void
  /** @preview WebSocket streaming is in development */
  onBar: (handler: (bar: Bar) => void) => void
}

/**
 * Helper to throw NotImplementedError with consistent formatting
 */
function notImplemented(method: string): never {
  throw new NotImplementedError(`CryptoStream.${method}()`, DOCS_URL)
}

/**
 * Create a crypto data stream client
 *
 * @preview WebSocket streaming is currently in development. All methods
 * will throw NotImplementedError until the feature is complete.
 */
export function createCryptoStream(_config: StreamConfig): CryptoStream {
  return {
    connect: () => notImplemented('connect'),
    disconnect: () => notImplemented('disconnect'),
    subscribeForTrades: () => notImplemented('subscribeForTrades'),
    subscribeForQuotes: () => notImplemented('subscribeForQuotes'),
    subscribeForBars: () => notImplemented('subscribeForBars'),
    unsubscribeFromTrades: () => notImplemented('unsubscribeFromTrades'),
    unsubscribeFromQuotes: () => notImplemented('unsubscribeFromQuotes'),
    unsubscribeFromBars: () => notImplemented('unsubscribeFromBars'),
    onTrade: () => notImplemented('onTrade'),
    onQuote: () => notImplemented('onQuote'),
    onBar: () => notImplemented('onBar'),
  }
}
