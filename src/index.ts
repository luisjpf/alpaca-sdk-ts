/**
 * @luisjpf/alpaca-sdk
 * Complete Alpaca SDK - Trading, Broker, Market Data, and Streaming
 */

// Core - Re-export all (no conflicts)
export * from './core'

// Trading - Export client factory and specific types
export { createTradingClient, type TradingClient, type TradingClientConfig } from './trading'

// Trading types (namespaced to avoid conflicts)
export type {
  Account as TradingAccount,
  Order as TradingOrder,
  Position as TradingPosition,
  Asset as TradingAsset,
  Clock as TradingClock,
  Calendar as TradingCalendar,
  Watchlist,
  PortfolioHistory,
  AccountConfigurations as TradingAccountConfigurations,
  AccountActivity,
  TradingActivity,
  NonTradeActivity,
  OrderRequest,
  PatchOrderRequest,
  OrderSide as TradingOrderSide,
  OrderType as TradingOrderType,
  TimeInForce as TradingTimeInForce,
  OrderClass as TradingOrderClass,
} from './trading'

// Market Data - Export client factory and types
export {
  createMarketDataClient,
  type MarketDataClient,
  type MarketDataClientConfig,
} from './market-data'

export type {
  StockBar,
  StockTrade,
  StockQuote,
  StockSnapshot,
  StockAuction,
  CryptoBar,
  CryptoTrade,
  CryptoQuote,
  CryptoSnapshot,
  CryptoOrderbook,
  OptionBar,
  OptionTrade,
  OptionQuote,
  OptionSnapshot,
  OptionGreeks,
  News,
  NewsImage,
  MostActive,
  Mover,
  CorporateActions,
} from './market-data'

// Broker - Export client factory and types
export { createBrokerClient, type BrokerClient, type BrokerClientConfig } from './broker'

// Broker types (namespaced to avoid conflicts)
export type {
  Account as BrokerAccount,
  AccountExtended,
  TradeAccount,
  AccountStatus,
  AccountConfigurations as BrokerAccountConfigurations,
  AccountCreationRequest,
  AccountUpdateRequest,
  Activity,
  TradeActivity as BrokerTradeActivity,
  NonTradeActivity as BrokerNonTradeActivity,
  ActivityType,
  Order as BrokerOrder,
  CreateOrderRequest,
  OrderSide as BrokerOrderSide,
  OrderType as BrokerOrderType,
  TimeInForce as BrokerTimeInForce,
  OrderClass as BrokerOrderClass,
  OrderStatus,
  Position as BrokerPosition,
  Transfer,
  CreateTransferRequest,
  TransferDirection,
  TransferType,
  ACHRelationship,
  CreateACHRelationshipRequest,
  AccountDocument,
  OwnerDocument,
  Contact,
  Identity,
  Disclosures,
  TrustedContact,
  Calendar as BrokerCalendar,
  Clock as BrokerClock,
} from './broker'

// Streaming - Export client factory, types, and type guards
export {
  createStockStream,
  type StockStream,
  createCryptoStream,
  type CryptoStream,
  createTradeUpdatesStream,
  type TradeUpdatesStream,
  type StreamConfig,
  type StreamState,
  // Type guards for streaming messages
  isTrade,
  isQuote,
  isBar,
  type Trade,
  type Quote,
  type Bar,
  type TradeUpdate,
} from './streaming'

// Unified client
export { createAlpacaClient, type AlpacaClient, type AlpacaClientConfig } from './client'
