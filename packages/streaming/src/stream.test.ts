/**
 * Unit tests for streaming clients
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import WebSocket from 'ws'
import { createStockStream } from './stock-stream'
import { createCryptoStream } from './crypto-stream'
import { createTradeUpdatesStream } from './trade-updates-stream'
import type { StockStreamConfig, CryptoStreamConfig, StreamConfig } from './types'

/** Mock WebSocket instance interface */
interface MockWebSocketInstance {
  readyState: number
  send: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  binaryType: string
  onopen: (() => void) | null
  onmessage: ((event: { data: string }) => void) | null
  onerror: ((event: { message: string }) => void) | null
  onclose: (() => void) | null
}

// Mock WebSocket
vi.mock('ws', () => {
  const MockWebSocket = vi.fn()

  MockWebSocket.prototype.send = vi.fn()
  MockWebSocket.prototype.close = vi.fn()
  MockWebSocket.prototype.addEventListener = vi.fn()
  MockWebSocket.OPEN = 1
  MockWebSocket.CONNECTING = 0
  MockWebSocket.CLOSING = 2
  MockWebSocket.CLOSED = 3

  return { default: MockWebSocket }
})

const testConfig: StreamConfig = {
  keyId: 'test-key',
  secretKey: 'test-secret',
  paper: true,
}

// Helper to get the WebSocket mock instance and trigger events
function getMockWebSocket(): MockWebSocketInstance | null {
  const MockWS = WebSocket as unknown as ReturnType<typeof vi.fn>
  const results = MockWS.mock.results
  if (results.length === 0) return null
  return results[results.length - 1].value as MockWebSocketInstance
}

function simulateOpen(ws: MockWebSocketInstance | null) {
  if (ws?.onopen) ws.onopen()
}

function simulateMessage(ws: MockWebSocketInstance | null, data: unknown) {
  if (ws?.onmessage) ws.onmessage({ data: JSON.stringify(data) })
}

function simulateError(ws: MockWebSocketInstance | null, message: string) {
  if (ws?.onerror) ws.onerror({ message })
}

describe('streaming', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementation
    const MockWS = WebSocket as unknown as ReturnType<typeof vi.fn>
    MockWS.mockImplementation(function (this: Record<string, unknown>) {
      this.readyState = 1 // WebSocket.OPEN
      this.send = vi.fn()
      this.close = vi.fn()
      this.binaryType = 'blob'
      return this
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('StockStream', () => {
    it('should return object with all expected methods', () => {
      const stream = createStockStream(testConfig)

      expect(stream).toHaveProperty('connect')
      expect(stream).toHaveProperty('disconnect')
      expect(stream).toHaveProperty('isConnected')
      expect(stream).toHaveProperty('subscribeForTrades')
      expect(stream).toHaveProperty('subscribeForQuotes')
      expect(stream).toHaveProperty('subscribeForBars')
      expect(stream).toHaveProperty('unsubscribeFromTrades')
      expect(stream).toHaveProperty('unsubscribeFromQuotes')
      expect(stream).toHaveProperty('unsubscribeFromBars')
      expect(stream).toHaveProperty('onTrade')
      expect(stream).toHaveProperty('onQuote')
      expect(stream).toHaveProperty('onBar')
      expect(stream).toHaveProperty('onConnect')
      expect(stream).toHaveProperty('onDisconnect')
      expect(stream).toHaveProperty('onError')
    })

    it('should not be connected initially', () => {
      const stream = createStockStream(testConfig)
      expect(stream.isConnected()).toBe(false)
    })

    it('should connect to iex feed by default', () => {
      const stream = createStockStream(testConfig)
      stream.connect()

      const MockWS = WebSocket as unknown as ReturnType<typeof vi.fn>
      expect(MockWS).toHaveBeenCalledWith('wss://stream.data.alpaca.markets/v2/iex')
    })

    it('should connect to sip feed when configured', () => {
      const sipConfig: StockStreamConfig = {
        ...testConfig,
        feed: 'sip',
      }
      const stream = createStockStream(sipConfig)
      stream.connect()

      const MockWS = WebSocket as unknown as ReturnType<typeof vi.fn>
      expect(MockWS).toHaveBeenCalledWith('wss://stream.data.alpaca.markets/v2/sip')
    })

    it('should connect to delayed_sip feed when configured', () => {
      const delayedConfig: StockStreamConfig = {
        ...testConfig,
        feed: 'delayed_sip',
      }
      const stream = createStockStream(delayedConfig)
      stream.connect()

      const MockWS = WebSocket as unknown as ReturnType<typeof vi.fn>
      expect(MockWS).toHaveBeenCalledWith('wss://stream.data.alpaca.markets/v2/delayed_sip')
    })

    it('should register trade handlers and receive messages', () => {
      const stream = createStockStream(testConfig)
      const handler = vi.fn()

      stream.onTrade(handler)
      stream.connect()

      const ws = getMockWebSocket()

      // Simulate successful authentication
      simulateOpen(ws)
      simulateMessage(ws, [{ T: 'success', msg: 'authenticated' }])

      // Simulate a trade message
      simulateMessage(ws, [
        {
          T: 't',
          S: 'AAPL',
          i: 12345,
          x: 'V',
          p: 150.25,
          s: 100,
          t: '2024-01-15T10:30:00Z',
          c: ['@'],
          z: 'A',
        },
      ])

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          T: 't',
          S: 'AAPL',
          p: 150.25,
        })
      )
    })

    it('should register quote handlers and receive messages', () => {
      const stream = createStockStream(testConfig)
      const handler = vi.fn()

      stream.onQuote(handler)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, [{ T: 'success', msg: 'authenticated' }])

      simulateMessage(ws, [
        {
          T: 'q',
          S: 'AAPL',
          bx: 'V',
          bp: 150.2,
          bs: 100,
          ax: 'V',
          ap: 150.3,
          as: 200,
          t: '2024-01-15T10:30:00Z',
          c: ['R'],
          z: 'A',
        },
      ])

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          T: 'q',
          S: 'AAPL',
          bp: 150.2,
          ap: 150.3,
        })
      )
    })

    it('should register bar handlers and receive messages', () => {
      const stream = createStockStream(testConfig)
      const handler = vi.fn()

      stream.onBar(handler)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, [{ T: 'success', msg: 'authenticated' }])

      simulateMessage(ws, [
        {
          T: 'b',
          S: 'AAPL',
          o: 150.0,
          h: 151.0,
          l: 149.5,
          c: 150.5,
          v: 10000,
          t: '2024-01-15T10:30:00Z',
          n: 150,
          vw: 150.25,
        },
      ])

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          T: 'b',
          S: 'AAPL',
          o: 150.0,
          c: 150.5,
        })
      )
    })

    it('should send subscribe message when connected', () => {
      const stream = createStockStream(testConfig)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, [{ T: 'success', msg: 'authenticated' }])

      stream.subscribeForTrades(['AAPL', 'MSFT'])

      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'subscribe',
          trades: ['AAPL', 'MSFT'],
        })
      )
    })

    it('should queue subscriptions when not connected', () => {
      const stream = createStockStream(testConfig)

      // Subscribe before connecting
      stream.subscribeForTrades(['AAPL'])

      // Connect
      stream.connect()

      const ws = getMockWebSocket()

      // Before auth, send should only have auth message
      simulateOpen(ws)

      // After auth, subscription should be sent
      simulateMessage(ws, [{ T: 'success', msg: 'authenticated' }])

      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'subscribe',
          trades: ['AAPL'],
        })
      )
    })

    it('should send unsubscribe message', () => {
      const stream = createStockStream(testConfig)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, [{ T: 'success', msg: 'authenticated' }])

      stream.subscribeForTrades(['AAPL', 'MSFT'])
      stream.unsubscribeFromTrades(['AAPL'])

      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'unsubscribe',
          trades: ['AAPL'],
        })
      )
    })

    it('should disconnect properly', () => {
      const stream = createStockStream(testConfig)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, [{ T: 'success', msg: 'authenticated' }])

      stream.disconnect()

      expect(ws.close).toHaveBeenCalled()
    })

    it('should call onConnect handler when authenticated', () => {
      const stream = createStockStream(testConfig)
      const handler = vi.fn()

      stream.onConnect(handler)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, [{ T: 'success', msg: 'authenticated' }])

      expect(handler).toHaveBeenCalled()
    })

    it('should call onError handler on error', () => {
      const stream = createStockStream(testConfig)
      const handler = vi.fn()

      stream.onError(handler)
      stream.connect()

      const ws = getMockWebSocket()

      simulateError(ws, 'Test error')

      expect(handler).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('CryptoStream', () => {
    it('should return object with all expected methods', () => {
      const stream = createCryptoStream(testConfig)

      expect(stream).toHaveProperty('connect')
      expect(stream).toHaveProperty('disconnect')
      expect(stream).toHaveProperty('isConnected')
      expect(stream).toHaveProperty('subscribeForTrades')
      expect(stream).toHaveProperty('subscribeForQuotes')
      expect(stream).toHaveProperty('subscribeForBars')
      expect(stream).toHaveProperty('onTrade')
      expect(stream).toHaveProperty('onQuote')
      expect(stream).toHaveProperty('onBar')
    })

    it('should not be connected initially', () => {
      const stream = createCryptoStream(testConfig)
      expect(stream.isConnected()).toBe(false)
    })

    it('should connect to us location by default', () => {
      const stream = createCryptoStream(testConfig)
      stream.connect()

      const MockWS = WebSocket as unknown as ReturnType<typeof vi.fn>
      expect(MockWS).toHaveBeenCalledWith('wss://stream.data.alpaca.markets/v1beta3/crypto/us')
    })

    it('should connect to us-1 location when configured', () => {
      const krakenUSConfig: CryptoStreamConfig = {
        ...testConfig,
        location: 'us-1',
      }
      const stream = createCryptoStream(krakenUSConfig)
      stream.connect()

      const MockWS = WebSocket as unknown as ReturnType<typeof vi.fn>
      expect(MockWS).toHaveBeenCalledWith('wss://stream.data.alpaca.markets/v1beta3/crypto/us-1')
    })

    it('should connect to eu-1 location when configured', () => {
      const krakenEUConfig: CryptoStreamConfig = {
        ...testConfig,
        location: 'eu-1',
      }
      const stream = createCryptoStream(krakenEUConfig)
      stream.connect()

      const MockWS = WebSocket as unknown as ReturnType<typeof vi.fn>
      expect(MockWS).toHaveBeenCalledWith('wss://stream.data.alpaca.markets/v1beta3/crypto/eu-1')
    })

    it('should register trade handlers and receive messages', () => {
      const stream = createCryptoStream(testConfig)
      const handler = vi.fn()

      stream.onTrade(handler)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, [{ T: 'success', msg: 'authenticated' }])

      simulateMessage(ws, [
        {
          T: 't',
          S: 'BTC/USD',
          i: 12345,
          x: 'CBSE',
          p: 45000.5,
          s: 0.1,
          t: '2024-01-15T10:30:00Z',
          c: [],
          z: '',
        },
      ])

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          T: 't',
          S: 'BTC/USD',
          p: 45000.5,
        })
      )
    })

    it('should send subscribe message when connected', () => {
      const stream = createCryptoStream(testConfig)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, [{ T: 'success', msg: 'authenticated' }])

      stream.subscribeForTrades(['BTC/USD', 'ETH/USD'])

      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'subscribe',
          trades: ['BTC/USD', 'ETH/USD'],
        })
      )
    })
  })

  describe('TradeUpdatesStream', () => {
    it('should return object with all expected methods', () => {
      const stream = createTradeUpdatesStream(testConfig)

      expect(stream).toHaveProperty('connect')
      expect(stream).toHaveProperty('disconnect')
      expect(stream).toHaveProperty('isConnected')
      expect(stream).toHaveProperty('subscribe')
      expect(stream).toHaveProperty('unsubscribe')
      expect(stream).toHaveProperty('onTradeUpdate')
      expect(stream).toHaveProperty('onConnect')
      expect(stream).toHaveProperty('onDisconnect')
      expect(stream).toHaveProperty('onError')
    })

    it('should not be connected initially', () => {
      const stream = createTradeUpdatesStream(testConfig)
      expect(stream.isConnected()).toBe(false)
    })

    it('should connect to paper trading URL by default', () => {
      const stream = createTradeUpdatesStream(testConfig)
      stream.connect()

      const MockWS = WebSocket as unknown as ReturnType<typeof vi.fn>
      expect(MockWS).toHaveBeenCalledWith('wss://paper-api.alpaca.markets/stream')
    })

    it('should connect to live trading URL when paper=false', () => {
      const liveConfig: StreamConfig = {
        ...testConfig,
        paper: false,
      }
      const stream = createTradeUpdatesStream(liveConfig)
      stream.connect()

      const MockWS = WebSocket as unknown as ReturnType<typeof vi.fn>
      expect(MockWS).toHaveBeenCalledWith('wss://api.alpaca.markets/stream')
    })

    it('should send authenticate message on connect', () => {
      const stream = createTradeUpdatesStream(testConfig)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)

      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'authenticate',
          data: {
            key_id: 'test-key',
            secret_key: 'test-secret',
          },
        })
      )
    })

    it('should register trade update handlers and receive messages', () => {
      const stream = createTradeUpdatesStream(testConfig)
      const handler = vi.fn()

      stream.onTradeUpdate(handler)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)

      // Simulate auth response
      simulateMessage(ws, {
        stream: 'authorization',
        data: { status: 'authorized', action: 'authenticate' },
      })

      // Subscribe to trade updates
      stream.subscribe()

      // Simulate a trade update message
      simulateMessage(ws, {
        stream: 'trade_updates',
        data: {
          event: 'fill',
          order: { id: '123', symbol: 'AAPL' },
          price: '150.25',
          qty: '10',
          timestamp: '2024-01-15T10:30:00Z',
        },
      })

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'fill',
          price: '150.25',
        })
      )
    })

    it('should send listen message when subscribing', () => {
      const stream = createTradeUpdatesStream(testConfig)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, {
        stream: 'authorization',
        data: { status: 'authorized', action: 'authenticate' },
      })

      stream.subscribe()

      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'listen',
          data: {
            streams: ['trade_updates'],
          },
        })
      )
    })

    it('should queue subscription when not connected', () => {
      const stream = createTradeUpdatesStream(testConfig)

      // Subscribe before connecting
      stream.subscribe()

      // Connect
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, {
        stream: 'authorization',
        data: { status: 'authorized', action: 'authenticate' },
      })

      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'listen',
          data: {
            streams: ['trade_updates'],
          },
        })
      )
    })

    it('should call onConnect handler when authenticated', () => {
      const stream = createTradeUpdatesStream(testConfig)
      const handler = vi.fn()

      stream.onConnect(handler)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, {
        stream: 'authorization',
        data: { status: 'authorized', action: 'authenticate' },
      })

      expect(handler).toHaveBeenCalled()
    })

    it('should handle authentication failure', () => {
      const stream = createTradeUpdatesStream(testConfig)
      const errorHandler = vi.fn()

      stream.onError(errorHandler)
      stream.connect()

      const ws = getMockWebSocket()

      simulateOpen(ws)
      simulateMessage(ws, {
        stream: 'authorization',
        data: { status: 'unauthorized' },
      })

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed',
        })
      )
    })
  })

  describe('MessagePack support', () => {
    it('should set binaryType when useMsgpack is true', () => {
      const msgpackConfig: StreamConfig = {
        ...testConfig,
        useMsgpack: true,
      }
      const stream = createStockStream(msgpackConfig)
      stream.connect()

      const ws = getMockWebSocket()

      expect(ws.binaryType).toBe('arraybuffer')
    })
  })
})
