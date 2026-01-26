/**
 * @alpaca-sdk/streaming
 * Alpaca WebSocket streaming client - real-time market data and trade updates
 */

export { createStockStream, type StockStream } from './stock-stream'
export { createCryptoStream, type CryptoStream } from './crypto-stream'
export { createTradeUpdatesStream, type TradeUpdatesStream } from './trade-updates-stream'
export type {
  StreamConfig,
  StreamState,
  StockStreamConfig,
  StockFeed,
  CryptoStreamConfig,
  CryptoLocation,
  Trade,
  Quote,
  Bar,
  TradeUpdate,
} from './types'
