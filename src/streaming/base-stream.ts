/**
 * Base WebSocket stream client with connection management, authentication,
 * and reconnection logic.
 */

import WebSocket from 'ws'
import { encode, decode } from '@msgpack/msgpack'
import type { StreamState, StreamConfig } from './types'

/** Reconnection configuration */
const RECONNECT_INITIAL_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000
const RECONNECT_BACKOFF_MULTIPLIER = 2

/** Connection timeout (30 seconds) */
const CONNECTION_TIMEOUT = 30000

/** Maximum number of messages to queue during disconnection */
const MAX_PENDING_MESSAGES = 1000

/** Maximum number of subscription callbacks to queue during disconnection */
const MAX_PENDING_SUBSCRIPTIONS = 1000

/** Message types from the server */
export interface ControlMessage {
  T: 'success' | 'error' | 'subscription'
  msg?: string
  code?: number
  trades?: string[]
  quotes?: string[]
  bars?: string[]
}

/** Event types emitted by the stream */
export type StreamEvent =
  | 'connected'
  | 'disconnected'
  | 'authenticated'
  | 'error'
  | 'trade'
  | 'quote'
  | 'bar'
  | 'trade_update'
  | 'subscription'

/** Event handler type */
export type EventHandler<T = unknown> = (data: T) => void

/**
 * Abstract base class for WebSocket streaming clients.
 *
 * Handles:
 * - WebSocket connection lifecycle
 * - Authentication flow
 * - Reconnection with exponential backoff
 * - Message parsing (JSON + MessagePack)
 * - Event emission
 * - Subscription queue during reconnection
 */
export abstract class BaseStream {
  protected ws: WebSocket | null = null
  protected state: StreamState = 'disconnected'
  protected config: StreamConfig
  protected reconnectAttempts = 0
  protected reconnectTimer: ReturnType<typeof setTimeout> | null = null
  protected connectionTimer: ReturnType<typeof setTimeout> | null = null
  protected shouldReconnect = true
  protected pendingSubscriptions: (() => void)[] = []
  protected pendingMessages: object[] = []
  protected eventHandlers = new Map<StreamEvent, Set<EventHandler>>()

  constructor(config: StreamConfig) {
    this.config = config
  }

  /**
   * Get the WebSocket URL for this stream type.
   */
  protected abstract getUrl(): string

  /**
   * Handle incoming messages from the WebSocket.
   */
  protected abstract handleMessage(data: unknown): void

  /**
   * Get the authentication message to send after connecting.
   */
  protected abstract getAuthMessage(): object

  /**
   * Called after successful authentication to restore subscriptions.
   * Override in subclasses to implement subscription restoration.
   */
  protected onReconnected(): void {
    // Default implementation does nothing
    // Subclasses should override to restore subscriptions
  }

  /**
   * Get the current connection state.
   */
  getState(): StreamState {
    return this.state
  }

  /**
   * Check if the stream is currently connected and authenticated.
   */
  isConnected(): boolean {
    return this.state === 'connected'
  }

  /**
   * Connect to the WebSocket server.
   */
  connect(): void {
    if (this.ws && (this.state === 'connecting' || this.state === 'connected')) {
      return
    }

    this.shouldReconnect = true
    this.doConnect()
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void {
    this.shouldReconnect = false
    this.clearReconnectTimer()
    this.clearConnectionTimer()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    // Clear queued messages to prevent stale data on reconnect
    this.pendingMessages = []
    this.pendingSubscriptions = []

    this.setState('disconnected')
  }

  /**
   * Register an event handler.
   */
  on<T = unknown>(event: StreamEvent, handler: EventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler as EventHandler)
  }

  /**
   * Remove an event handler.
   */
  off<T = unknown>(event: StreamEvent, handler: EventHandler<T>): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler as EventHandler)
    }
  }

  /**
   * Remove all handlers for a specific event, or all handlers if no event specified.
   */
  removeAllListeners(event?: StreamEvent): void {
    if (event) {
      this.eventHandlers.delete(event)
    } else {
      this.eventHandlers.clear()
    }
  }

  /**
   * Emit an event to all registered handlers.
   */
  protected emit(event: StreamEvent, data?: unknown): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data)
        } catch (error) {
          // For error handlers, just log to avoid infinite recursion
          // For other handlers, re-emit as an error event
          if (event === 'error') {
            console.error(`Error in ${event} handler:`, error)
          } else {
            this.emit(
              'error',
              error instanceof Error
                ? error
                : new Error(`Error in ${event} handler: ${String(error)}`)
            )
          }
        }
      }
    }
  }

  /**
   * Perform the actual WebSocket connection.
   */
  private doConnect(): void {
    this.setState('connecting')

    // Set connection timeout
    this.connectionTimer = setTimeout(() => {
      if (this.state === 'connecting' || this.state === 'authenticating') {
        this.emit('error', new Error('Connection timeout'))
        if (this.ws) {
          this.ws.close()
        }
      }
    }, CONNECTION_TIMEOUT)

    const url = this.getUrl()
    this.ws = new WebSocket(url)

    if (this.config.useMsgpack) {
      this.ws.binaryType = 'arraybuffer'
    }

    this.ws.onopen = () => {
      // Wait for server's 'connected' message before authenticating
      this.setState('authenticating')
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

  /**
   * Send the authentication message.
   */
  private authenticate(): void {
    this.send(this.getAuthMessage())
  }

  /**
   * Handle incoming WebSocket messages.
   */
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
    } catch (error) {
      this.emit(
        'error',
        new Error(
          `Failed to parse message: ${error instanceof Error ? error.message : String(error)}`
        )
      )
      return
    }

    // Handle arrays of messages
    if (Array.isArray(data)) {
      for (const message of data) {
        this.processMessage(message as Record<string, unknown>)
      }
    } else {
      this.processMessage(data as Record<string, unknown>)
    }
  }

  /**
   * Process a single message from the server.
   */
  private processMessage(message: Record<string, unknown>): void {
    const type = message.T as string

    // Handle control messages
    if (type === 'success') {
      const msg = message.msg as string | undefined
      if (msg === 'connected') {
        // Initial connection message - send auth
        this.authenticate()
      } else if (msg === 'authenticated') {
        this.onAuthenticated()
      }
      return
    }

    if (type === 'error') {
      const errorMsg = (message.msg as string) || 'Unknown error'
      const errorCode = message.code as number | undefined
      this.emit('error', new Error(`[${String(errorCode ?? 'unknown')}] ${errorMsg}`))

      // Auth errors should not reconnect
      if (errorCode === 401 || errorCode === 402 || errorCode === 403) {
        this.shouldReconnect = false
        this.disconnect()
      }
      return
    }

    if (type === 'subscription') {
      this.emit('subscription', message)
      return
    }

    // Delegate other messages to the subclass
    this.handleMessage(message)
  }

  /**
   * Called when authentication is successful.
   */
  private onAuthenticated(): void {
    this.clearConnectionTimer()
    const wasReconnect = this.reconnectAttempts > 0
    this.setState('connected')
    this.reconnectAttempts = 0
    this.emit('connected')
    this.emit('authenticated')

    // Restore subscriptions on reconnect
    if (wasReconnect) {
      this.onReconnected()
    }

    // Process any pending subscriptions
    for (const subscribe of this.pendingSubscriptions) {
      subscribe()
    }
    this.pendingSubscriptions = []

    // Send any messages that were queued during disconnection
    for (const message of this.pendingMessages) {
      this.send(message)
    }
    this.pendingMessages = []
  }

  /**
   * Send a message to the WebSocket server.
   * If not connected, queues the message to be sent after reconnection.
   * If the queue is full, emits an error and drops the message.
   */
  protected send(message: object): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      // Queue message to be sent after reconnection, with size limit
      if (this.pendingMessages.length >= MAX_PENDING_MESSAGES) {
        this.emit(
          'error',
          new Error(
            `Message queue full (max ${String(MAX_PENDING_MESSAGES)}). Message dropped. Consider reconnecting.`
          )
        )
        return
      }
      this.pendingMessages.push(message)
      return
    }

    if (this.config.useMsgpack) {
      this.ws.send(encode(message))
    } else {
      this.ws.send(JSON.stringify(message))
    }
  }

  /**
   * Queue a subscription to be sent when connected.
   * If the queue is full, emits an error and drops the subscription.
   */
  protected queueOrSend(action: () => void): void {
    if (this.state === 'connected') {
      action()
    } else {
      if (this.pendingSubscriptions.length >= MAX_PENDING_SUBSCRIPTIONS) {
        this.emit(
          'error',
          new Error(
            `Subscription queue full (max ${String(MAX_PENDING_SUBSCRIPTIONS)}). Subscription dropped.`
          )
        )
        return
      }
      this.pendingSubscriptions.push(action)
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff.
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer()
    this.setState('disconnected')

    const delay = Math.min(
      RECONNECT_INITIAL_DELAY * Math.pow(RECONNECT_BACKOFF_MULTIPLIER, this.reconnectAttempts),
      RECONNECT_MAX_DELAY
    )

    this.reconnectAttempts++

    this.reconnectTimer = setTimeout(() => {
      this.doConnect()
    }, delay)
  }

  /**
   * Clear the reconnection timer.
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * Clear the connection timeout timer.
   */
  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }
  }

  /**
   * Update the connection state and emit state change event.
   */
  private setState(state: StreamState): void {
    if (this.state !== state) {
      this.state = state
    }
  }
}
