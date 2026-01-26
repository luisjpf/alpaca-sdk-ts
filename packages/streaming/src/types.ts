/**
 * Streaming types
 */

export type StreamState = 'disconnected' | 'connecting' | 'authenticating' | 'connected' | 'error'

export interface StreamConfig {
  keyId: string
  secretKey: string
  paper?: boolean
  /** Use MessagePack encoding instead of JSON */
  useMsgpack?: boolean
}

/**
 * Stock data feed types:
 * - `sip` - Full SIP feed (requires paid Algo Trader Plus subscription)
 * - `iex` - IEX feed only (available on free Basic plan)
 * - `delayed_sip` - 15-minute delayed SIP data
 */
export type StockFeed = 'sip' | 'iex' | 'delayed_sip'

/**
 * Configuration for stock data streaming
 */
export interface StockStreamConfig extends StreamConfig {
  /** Stock data feed to use. Defaults to 'iex'. */
  feed?: StockFeed
}

/**
 * Crypto data locations:
 * - `us` - Alpaca US exchange
 * - `us-1` - Kraken US (limited to 23 US states)
 * - `eu-1` - Kraken EU
 */
export type CryptoLocation = 'us' | 'us-1' | 'eu-1'

/**
 * Configuration for crypto data streaming
 */
export interface CryptoStreamConfig extends StreamConfig {
  /** Crypto exchange location. Defaults to 'us'. */
  location?: CryptoLocation
}

export interface StreamEventHandlers<T> {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  onStateChange?: (state: StreamState) => void
  onMessage?: (message: T) => void
}

export interface Trade {
  T: 't'
  S: string // Symbol
  i: number // Trade ID
  x: string // Exchange
  p: number // Price
  s: number // Size
  t: string // Timestamp
  c: string[] // Conditions
  z: string // Tape
}

export interface Quote {
  T: 'q'
  S: string // Symbol
  bx: string // Bid exchange
  bp: number // Bid price
  bs: number // Bid size
  ax: string // Ask exchange
  ap: number // Ask price
  as: number // Ask size
  t: string // Timestamp
  c: string[] // Conditions
  z: string // Tape
}

export interface Bar {
  T: 'b'
  S: string // Symbol
  o: number // Open
  h: number // High
  l: number // Low
  c: number // Close
  v: number // Volume
  t: string // Timestamp
  n: number // Trade count
  vw: number // VWAP
}

export interface TradeUpdate {
  event: string
  order: unknown
  position_qty?: string
  price?: string
  qty?: string
  timestamp?: string
}

/**
 * Message types for market data streams (stocks, crypto)
 */
export type MarketDataMessage = Trade | Quote | Bar

/**
 * Subscription action types for market data
 */
export interface MarketDataSubscription {
  action: 'subscribe' | 'unsubscribe'
  trades?: string[]
  quotes?: string[]
  bars?: string[]
}

/**
 * Authentication message for market data streams
 */
export interface MarketDataAuth {
  action: 'auth'
  key: string
  secret: string
}

/**
 * Authentication message for trade updates stream
 */
export interface TradeUpdatesAuth {
  action: 'authenticate'
  data: {
    key_id: string
    secret_key: string
  }
}

/**
 * Listen message for trade updates stream
 */
export interface TradeUpdatesListen {
  action: 'listen'
  data: {
    streams: string[]
  }
}
