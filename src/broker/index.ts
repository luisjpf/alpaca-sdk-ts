/**
 * @luisjpf/broker
 * Alpaca Broker API client - sub-account management, funding, trading on behalf
 */

// Client factory and type
export { createBrokerClient, type BrokerClient, type BrokerClientConfig } from './client'

// Account types
export type {
  Account,
  AccountExtended,
  TradeAccount,
  AccountStatus,
  AccountConfigurations,
  AccountCreationRequest,
  AccountUpdateRequest,
} from './client'

// Activity types
export type { Activity, TradeActivity, NonTradeActivity, ActivityType } from './client'

// Order types
export type {
  Order,
  CreateOrderRequest,
  OrderSide,
  OrderType,
  TimeInForce,
  OrderClass,
  OrderStatus,
} from './client'

// Position types
export type { Position } from './client'

// Transfer types
export type { Transfer, CreateTransferRequest, TransferDirection, TransferType } from './client'

// ACH types
export type { ACHRelationship, CreateACHRelationshipRequest } from './client'

// Document types
export type { AccountDocument, OwnerDocument } from './client'

// Identity types
export type { Contact, Identity, Disclosures, TrustedContact } from './client'

// Calendar and Clock
export type { Calendar, Clock } from './client'

// Re-export generated types for advanced usage
export type { paths, components, operations } from './generated/broker-api'
