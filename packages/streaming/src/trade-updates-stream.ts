/**
 * Trade/Account updates streaming
 *
 * @preview WebSocket streaming is currently in development. All methods
 * will throw NotImplementedError until the feature is complete.
 */

import type { StreamConfig, TradeUpdate } from './types'
import { NotImplementedError } from '@alpaca-sdk/core'

const DOCS_URL = 'https://github.com/alpacahq/alpaca-sdk-ts#streaming-preview'

export interface TradeUpdatesStream {
  /** @preview WebSocket streaming is in development */
  connect: () => void
  /** @preview WebSocket streaming is in development */
  disconnect: () => void
  /** @preview WebSocket streaming is in development */
  subscribe: () => void
  /** @preview WebSocket streaming is in development */
  unsubscribe: () => void
  /** @preview WebSocket streaming is in development */
  onTradeUpdate: (handler: (update: TradeUpdate) => void) => void
}

/**
 * Helper to throw NotImplementedError with consistent formatting
 */
function notImplemented(method: string): never {
  throw new NotImplementedError(`TradeUpdatesStream.${method}()`, DOCS_URL)
}

/**
 * Create a trade updates stream client
 *
 * @preview WebSocket streaming is currently in development. All methods
 * will throw NotImplementedError until the feature is complete.
 */
export function createTradeUpdatesStream(_config: StreamConfig): TradeUpdatesStream {
  return {
    connect: () => notImplemented('connect'),
    disconnect: () => notImplemented('disconnect'),
    subscribe: () => notImplemented('subscribe'),
    unsubscribe: () => notImplemented('unsubscribe'),
    onTradeUpdate: () => notImplemented('onTradeUpdate'),
  }
}
