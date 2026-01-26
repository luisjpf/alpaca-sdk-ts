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
