/**
 * Unit tests for streaming clients
 */

import { describe, it, expect } from 'vitest'
import { NotImplementedError } from '@alpaca-sdk/core'
import { createStockStream } from './stock-stream'
import { createCryptoStream } from './crypto-stream'
import { createTradeUpdatesStream } from './trade-updates-stream'
import type { StreamConfig } from './types'

const testConfig: StreamConfig = {
  keyId: 'test-key',
  secretKey: 'test-secret',
  paper: true,
}

// No-op handler for tests
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

describe('streaming', () => {
  describe('StockStream', () => {
    const stream = createStockStream(testConfig)

    it('should return object with all expected methods', () => {
      expect(stream).toHaveProperty('connect')
      expect(stream).toHaveProperty('disconnect')
      expect(stream).toHaveProperty('subscribeForTrades')
      expect(stream).toHaveProperty('subscribeForQuotes')
      expect(stream).toHaveProperty('subscribeForBars')
      expect(stream).toHaveProperty('unsubscribeFromTrades')
      expect(stream).toHaveProperty('unsubscribeFromQuotes')
      expect(stream).toHaveProperty('unsubscribeFromBars')
      expect(stream).toHaveProperty('onTrade')
      expect(stream).toHaveProperty('onQuote')
      expect(stream).toHaveProperty('onBar')
    })

    it('connect should throw NotImplementedError', () => {
      expect(() => {
        stream.connect()
      }).toThrow(NotImplementedError)
    })

    it('disconnect should throw NotImplementedError', () => {
      expect(() => {
        stream.disconnect()
      }).toThrow(NotImplementedError)
    })

    it('subscribeForTrades should throw NotImplementedError', () => {
      expect(() => {
        stream.subscribeForTrades(['AAPL'])
      }).toThrow(NotImplementedError)
    })

    it('subscribeForQuotes should throw NotImplementedError', () => {
      expect(() => {
        stream.subscribeForQuotes(['AAPL'])
      }).toThrow(NotImplementedError)
    })

    it('subscribeForBars should throw NotImplementedError', () => {
      expect(() => {
        stream.subscribeForBars(['AAPL'])
      }).toThrow(NotImplementedError)
    })

    it('unsubscribeFromTrades should throw NotImplementedError', () => {
      expect(() => {
        stream.unsubscribeFromTrades(['AAPL'])
      }).toThrow(NotImplementedError)
    })

    it('unsubscribeFromQuotes should throw NotImplementedError', () => {
      expect(() => {
        stream.unsubscribeFromQuotes(['AAPL'])
      }).toThrow(NotImplementedError)
    })

    it('unsubscribeFromBars should throw NotImplementedError', () => {
      expect(() => {
        stream.unsubscribeFromBars(['AAPL'])
      }).toThrow(NotImplementedError)
    })

    it('onTrade should throw NotImplementedError', () => {
      expect(() => {
        stream.onTrade(noop)
      }).toThrow(NotImplementedError)
    })

    it('onQuote should throw NotImplementedError', () => {
      expect(() => {
        stream.onQuote(noop)
      }).toThrow(NotImplementedError)
    })

    it('onBar should throw NotImplementedError', () => {
      expect(() => {
        stream.onBar(noop)
      }).toThrow(NotImplementedError)
    })

    it('error should include method name', () => {
      try {
        stream.connect()
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as NotImplementedError).feature).toContain('StockStream.connect()')
      }
    })

    it('error should include docs URL', () => {
      try {
        stream.connect()
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as NotImplementedError).docsUrl).toContain('streaming-preview')
      }
    })
  })

  describe('CryptoStream', () => {
    const stream = createCryptoStream(testConfig)

    it('should return object with all expected methods', () => {
      expect(stream).toHaveProperty('connect')
      expect(stream).toHaveProperty('disconnect')
      expect(stream).toHaveProperty('subscribeForTrades')
      expect(stream).toHaveProperty('subscribeForQuotes')
      expect(stream).toHaveProperty('subscribeForBars')
      expect(stream).toHaveProperty('unsubscribeFromTrades')
      expect(stream).toHaveProperty('unsubscribeFromQuotes')
      expect(stream).toHaveProperty('unsubscribeFromBars')
      expect(stream).toHaveProperty('onTrade')
      expect(stream).toHaveProperty('onQuote')
      expect(stream).toHaveProperty('onBar')
    })

    it('connect should throw NotImplementedError', () => {
      expect(() => {
        stream.connect()
      }).toThrow(NotImplementedError)
    })

    it('disconnect should throw NotImplementedError', () => {
      expect(() => {
        stream.disconnect()
      }).toThrow(NotImplementedError)
    })

    it('subscribeForTrades should throw NotImplementedError', () => {
      expect(() => {
        stream.subscribeForTrades(['BTC/USD'])
      }).toThrow(NotImplementedError)
    })

    it('onTrade should throw NotImplementedError', () => {
      expect(() => {
        stream.onTrade(noop)
      }).toThrow(NotImplementedError)
    })

    it('error should include method name', () => {
      try {
        stream.connect()
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as NotImplementedError).feature).toContain('CryptoStream.connect()')
      }
    })

    it('error should include docs URL', () => {
      try {
        stream.connect()
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as NotImplementedError).docsUrl).toContain('streaming-preview')
      }
    })
  })

  describe('TradeUpdatesStream', () => {
    const stream = createTradeUpdatesStream(testConfig)

    it('should return object with all expected methods', () => {
      expect(stream).toHaveProperty('connect')
      expect(stream).toHaveProperty('disconnect')
      expect(stream).toHaveProperty('subscribe')
      expect(stream).toHaveProperty('unsubscribe')
      expect(stream).toHaveProperty('onTradeUpdate')
    })

    it('connect should throw NotImplementedError', () => {
      expect(() => {
        stream.connect()
      }).toThrow(NotImplementedError)
    })

    it('disconnect should throw NotImplementedError', () => {
      expect(() => {
        stream.disconnect()
      }).toThrow(NotImplementedError)
    })

    it('subscribe should throw NotImplementedError', () => {
      expect(() => {
        stream.subscribe()
      }).toThrow(NotImplementedError)
    })

    it('unsubscribe should throw NotImplementedError', () => {
      expect(() => {
        stream.unsubscribe()
      }).toThrow(NotImplementedError)
    })

    it('onTradeUpdate should throw NotImplementedError', () => {
      expect(() => {
        stream.onTradeUpdate(noop)
      }).toThrow(NotImplementedError)
    })

    it('error should include method name', () => {
      try {
        stream.connect()
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as NotImplementedError).feature).toContain('TradeUpdatesStream.connect()')
      }
    })

    it('error should include docs URL', () => {
      try {
        stream.subscribe()
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as NotImplementedError).docsUrl).toContain('streaming-preview')
      }
    })
  })
})
