/**
 * Trade/Account updates streaming
 *
 * Provides real-time updates on order fills, cancellations, rejections,
 * and other trade-related events.
 */

import WebSocket from 'ws'
import { encode, decode } from '@msgpack/msgpack'
import type {
  StreamConfig,
  StreamState,
  TradeUpdate,
  TradeUpdatesAuth,
  TradeUpdatesListen,
} from './types'

/** Paper trading WebSocket URL */
const PAPER_TRADING_URL = 'wss://paper-api.alpaca.markets/stream'

/** Live trading WebSocket URL */
const LIVE_TRADING_URL = 'wss://api.alpaca.markets/stream'

/** Reconnection configuration */
const RECONNECT_INITIAL_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000
const RECONNECT_BACKOFF_MULTIPLIER = 2

export interface TradeUpdatesStream {
  /** Connect to the WebSocket server */
  connect: () => void
  /** Disconnect from the WebSocket server */
  disconnect: () => void
  /** Check if connected and authenticated */
  isConnected: () => boolean
  /** Subscribe to trade updates */
  subscribe: () => void
  /** Unsubscribe from trade updates */
  unsubscribe: () => void
  /** Register a handler for trade update events */
  onTradeUpdate: (handler: (update: TradeUpdate) => void) => void
  /** Register a handler for connection events */
  onConnect: (handler: () => void) => void
  /** Register a handler for disconnection events */
  onDisconnect: (handler: () => void) => void
  /** Register a handler for error events */
  onError: (handler: (error: Error) => void) => void
}

/** Event handler type */
type EventHandler<T = unknown> = (data: T) => void

/**
 * Internal implementation of the trade updates stream client.
 *
 * The trade updates stream has a different protocol than market data streams:
 * - Authentication uses `authenticate` action with `key_id` and `secret_key`
 * - Subscription uses `listen` action with `streams` array
 */
class TradeUpdatesStreamImpl {
  private ws: WebSocket | null = null
  private state: StreamState = 'disconnected'
  private config: StreamConfig
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = true
  private isSubscribed = false
  private pendingSubscribe = false
  private eventHandlers = new Map<string, Set<EventHandler>>()

  constructor(config: StreamConfig) {
    this.config = config
  }

  private getUrl(): string {
    return this.config.paper === false ? LIVE_TRADING_URL : PAPER_TRADING_URL
  }

  getState(): StreamState {
    return this.state
  }

  isConnected(): boolean {
    return this.state === 'connected'
  }

  connect(): void {
    if (this.ws && (this.state === 'connecting' || this.state === 'connected')) {
      return
    }

    this.shouldReconnect = true
    this.doConnect()
  }

  disconnect(): void {
    this.shouldReconnect = false
    this.clearReconnectTimer()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.setState('disconnected')
    this.isSubscribed = false
  }

  subscribe(): void {
    if (this.state === 'connected') {
      this.doSubscribe()
    } else {
      this.pendingSubscribe = true
    }
  }

  unsubscribe(): void {
    if (this.state !== 'connected' || !this.isSubscribed) {
      return
    }

    const message: TradeUpdatesListen = {
      action: 'listen',
      data: {
        streams: [],
      },
    }
    this.send(message)
    this.isSubscribed = false
  }

  onTradeUpdate(handler: (update: TradeUpdate) => void): void {
    this.on('trade_update', handler)
  }

  onConnect(handler: () => void): void {
    this.on('connected', handler)
  }

  onDisconnect(handler: () => void): void {
    this.on('disconnected', handler)
  }

  onError(handler: (error: Error) => void): void {
    this.on('error', handler)
  }

  private on<T = unknown>(event: string, handler: EventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler as EventHandler)
  }

  private emit(event: string, data?: unknown): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in ${event} handler:`, error)
        }
      }
    }
  }

  private doConnect(): void {
    this.setState('connecting')

    const url = this.getUrl()
    this.ws = new WebSocket(url)

    if (this.config.useMsgpack) {
      this.ws.binaryType = 'arraybuffer'
    }

    this.ws.onopen = () => {
      this.setState('authenticating')
      this.authenticate()
    }

    this.ws.onmessage = (event: WebSocket.MessageEvent) => {
      this.onMessage(event)
    }

    this.ws.onerror = (event: WebSocket.ErrorEvent) => {
      this.emit('error', new Error(event.message || 'WebSocket error'))
    }

    this.ws.onclose = () => {
      const wasConnected = this.state === 'connected'
      this.ws = null
      this.isSubscribed = false

      if (this.shouldReconnect) {
        this.scheduleReconnect()
      } else {
        this.setState('disconnected')
      }

      if (wasConnected) {
        this.emit('disconnected')
      }
    }
  }

  private authenticate(): void {
    const message: TradeUpdatesAuth = {
      action: 'authenticate',
      data: {
        key_id: this.config.keyId,
        secret_key: this.config.secretKey,
      },
    }
    this.send(message)
  }

  private doSubscribe(): void {
    const message: TradeUpdatesListen = {
      action: 'listen',
      data: {
        streams: ['trade_updates'],
      },
    }
    this.send(message)
    this.isSubscribed = true
  }

  private onMessage(event: WebSocket.MessageEvent): void {
    let data: unknown

    try {
      if (this.config.useMsgpack && event.data instanceof ArrayBuffer) {
        data = decode(new Uint8Array(event.data))
      } else if (typeof event.data === 'string') {
        data = JSON.parse(event.data)
      } else {
        return
      }
    } catch {
      return
    }

    this.processMessage(data as Record<string, unknown>)
  }

  private processMessage(message: Record<string, unknown>): void {
    const stream = message.stream as string | undefined
    const data = message.data as Record<string, unknown> | undefined

    // Handle authentication response
    if (stream === 'authorization') {
      const status = data?.status as string | undefined
      const action = data?.action as string | undefined

      if (status === 'authorized' && action === 'authenticate') {
        this.onAuthenticated()
      } else if (status === 'unauthorized') {
        this.emit('error', new Error('Authentication failed'))
        this.shouldReconnect = false
        this.disconnect()
      }
      return
    }

    // Handle listening confirmation
    if (stream === 'listening') {
      // Successfully subscribed
      return
    }

    // Handle trade updates
    if (stream === 'trade_updates' && data) {
      this.emit('trade_update', data as unknown as TradeUpdate)
      return
    }
  }

  private onAuthenticated(): void {
    this.setState('connected')
    this.reconnectAttempts = 0
    this.emit('connected')

    // Process pending subscription
    if (this.pendingSubscribe) {
      this.pendingSubscribe = false
      this.doSubscribe()
    }
  }

  private send(message: object): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return
    }

    if (this.config.useMsgpack) {
      this.ws.send(encode(message))
    } else {
      this.ws.send(JSON.stringify(message))
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer()
    this.setState('disconnected')

    const delay = Math.min(
      RECONNECT_INITIAL_DELAY * Math.pow(RECONNECT_BACKOFF_MULTIPLIER, this.reconnectAttempts),
      RECONNECT_MAX_DELAY
    )

    this.reconnectAttempts++

    // If we were subscribed, mark for re-subscription after reconnect
    if (this.isSubscribed) {
      this.pendingSubscribe = true
      this.isSubscribed = false
    }

    this.reconnectTimer = setTimeout(() => {
      this.doConnect()
    }, delay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private setState(state: StreamState): void {
    if (this.state !== state) {
      this.state = state
    }
  }
}

/**
 * Create a trade updates stream client.
 *
 * @param config - Stream configuration including API credentials
 * @returns Trade updates stream client
 *
 * @example
 * ```typescript
 * const stream = createTradeUpdatesStream({
 *   keyId: 'your-api-key',
 *   secretKey: 'your-api-secret',
 *   paper: true, // true for paper trading, false for live
 * })
 *
 * stream.onTradeUpdate((update) => {
 *   console.log(`Order ${update.event}: ${JSON.stringify(update.order)}`)
 * })
 *
 * stream.connect()
 * stream.subscribe()
 * ```
 */
export function createTradeUpdatesStream(config: StreamConfig): TradeUpdatesStream {
  const impl = new TradeUpdatesStreamImpl(config)

  return {
    connect: () => { impl.connect(); },
    disconnect: () => { impl.disconnect(); },
    isConnected: () => impl.isConnected(),
    subscribe: () => { impl.subscribe(); },
    unsubscribe: () => { impl.unsubscribe(); },
    onTradeUpdate: (handler) => { impl.onTradeUpdate(handler); },
    onConnect: (handler) => { impl.onConnect(handler); },
    onDisconnect: (handler) => { impl.onDisconnect(handler); },
    onError: (handler) => { impl.onError(handler); },
  }
}
