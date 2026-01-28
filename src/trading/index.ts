/**
 * @luisjpf/trading
 * Alpaca Trading API client - orders, positions, account management
 */

// Client factory and type
export { createTradingClient, type TradingClient, type TradingClientConfig } from './client'

// Entity types from OpenAPI
export type {
  Account,
  Order,
  Position,
  Asset,
  Clock,
  Calendar,
  Watchlist,
  PortfolioHistory,
  AccountConfigurations,
  AccountActivity,
  TradingActivity,
  NonTradeActivity,
  OrderRequest,
  PatchOrderRequest,
  OrderSide,
  OrderType,
  TimeInForce,
  OrderClass,
} from './client'

// Re-export generated types for advanced usage
export type { paths, components, operations } from './generated/trading-api'
