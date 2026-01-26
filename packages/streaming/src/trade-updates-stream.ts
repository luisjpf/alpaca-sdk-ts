/**
 * Trade/Account updates streaming
 */

import type { StreamConfig, TradeUpdate } from './types'

export interface TradeUpdatesStream {
  connect: () => void
  disconnect: () => void
  subscribe: () => void
  unsubscribe: () => void
  onTradeUpdate: (handler: (update: TradeUpdate) => void) => void
}

/**
 * Create a trade updates stream
 */
export function createTradeUpdatesStream(_config: StreamConfig): TradeUpdatesStream {
  // TODO: Implement WebSocket connection
  return {
    connect: () => {
      throw new Error('Not implemented')
    },
    disconnect: () => {
      throw new Error('Not implemented')
    },
    subscribe: () => {
      throw new Error('Not implemented')
    },
    unsubscribe: () => {
      throw new Error('Not implemented')
    },
    onTradeUpdate: () => {
      throw new Error('Not implemented')
    },
  }
}
