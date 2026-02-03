/**
 * @luisjpf/streaming
 * Alpaca WebSocket streaming client - real-time market data and trade updates
 */

export { createStockStream, type StockStream } from './stock-stream'
export { createCryptoStream, type CryptoStream } from './crypto-stream'
export { createTradeUpdatesStream, type TradeUpdatesStream } from './trade-updates-stream'
export {
  isTrade,
  isQuote,
  isBar,
  type StreamConfig,
  type StreamState,
  type StockStreamConfig,
  type StockFeed,
  type CryptoStreamConfig,
  type CryptoLocation,
  type Trade,
  type Quote,
  type Bar,
  type TradeUpdate,
} from './types'
