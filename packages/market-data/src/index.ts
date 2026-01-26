/**
 * @alpaca-sdk/market-data
 * Alpaca Market Data API client - stocks, crypto, options, news
 */

// Client factory and type
export {
  createMarketDataClient,
  type MarketDataClient,
  type MarketDataClientConfig,
} from './client'

// Stock data types
export type { StockBar, StockTrade, StockQuote, StockSnapshot, StockAuction } from './client'

// Crypto data types
export type { CryptoBar, CryptoTrade, CryptoQuote, CryptoSnapshot, CryptoOrderbook } from './client'

// Options data types
export type { OptionBar, OptionTrade, OptionQuote, OptionSnapshot, OptionGreeks } from './client'

// News types
export type { News, NewsImage } from './client'

// Screener types
export type { MostActive, Mover } from './client'

// Corporate actions
export type { CorporateActions } from './client'

// Re-export generated types for advanced usage
export type { paths, components, operations } from './generated/market-data-api'
