/**
 * Unit tests for unified Alpaca client
 */

import { describe, it, expect } from 'vitest'
import { createAlpacaClient } from './client'
import type { AlpacaClient, AlpacaClientConfig } from './client'

const testConfig: AlpacaClientConfig = {
  keyId: 'test-key-id',
  secretKey: 'test-secret-key',
  paper: true,
}

describe('createAlpacaClient', () => {
  it('should return object with all namespaces', () => {
    const client = createAlpacaClient(testConfig)

    expect(client).toHaveProperty('trading')
    expect(client).toHaveProperty('broker')
    expect(client).toHaveProperty('marketData')
    expect(client).toHaveProperty('streams')
  })

  describe('trading namespace', () => {
    it('should have account methods', () => {
      const client = createAlpacaClient(testConfig)

      expect(client.trading).toHaveProperty('account')
      expect(client.trading.account).toHaveProperty('get')
      expect(client.trading.account).toHaveProperty('getConfigurations')
    })

    it('should have orders methods', () => {
      const client = createAlpacaClient(testConfig)

      expect(client.trading).toHaveProperty('orders')
      expect(client.trading.orders).toHaveProperty('list')
      expect(client.trading.orders).toHaveProperty('create')
      expect(client.trading.orders).toHaveProperty('get')
      expect(client.trading.orders).toHaveProperty('cancel')
    })

    it('should have positions methods', () => {
      const client = createAlpacaClient(testConfig)

      expect(client.trading).toHaveProperty('positions')
      expect(client.trading.positions).toHaveProperty('list')
      expect(client.trading.positions).toHaveProperty('get')
    })
  })

  describe('broker namespace', () => {
    it('should have accounts methods', () => {
      const client = createAlpacaClient(testConfig)

      expect(client.broker).toHaveProperty('accounts')
      expect(client.broker.accounts).toHaveProperty('list')
      expect(client.broker.accounts).toHaveProperty('create')
    })

    it('should have transfers methods', () => {
      const client = createAlpacaClient(testConfig)

      expect(client.broker).toHaveProperty('transfers')
      expect(client.broker.transfers).toHaveProperty('list')
      expect(client.broker.transfers).toHaveProperty('create')
      expect(client.broker.transfers).toHaveProperty('delete')
    })
  })

  describe('marketData namespace', () => {
    it('should have stocks methods', () => {
      const client = createAlpacaClient(testConfig)

      expect(client.marketData).toHaveProperty('stocks')
      expect(client.marketData.stocks).toHaveProperty('getTrades')
      expect(client.marketData.stocks).toHaveProperty('getQuotes')
      expect(client.marketData.stocks).toHaveProperty('getBars')
    })

    it('should have crypto methods', () => {
      const client = createAlpacaClient(testConfig)

      expect(client.marketData).toHaveProperty('crypto')
    })

    it('should have options methods', () => {
      const client = createAlpacaClient(testConfig)

      expect(client.marketData).toHaveProperty('options')
    })
  })

  describe('streams namespace', () => {
    it('should have stocks stream', () => {
      const client = createAlpacaClient(testConfig)

      expect(client.streams).toHaveProperty('stocks')
      expect(client.streams.stocks).toHaveProperty('connect')
      expect(client.streams.stocks).toHaveProperty('disconnect')
      expect(client.streams.stocks).toHaveProperty('subscribeForTrades')
    })

    it('should have crypto stream', () => {
      const client = createAlpacaClient(testConfig)

      expect(client.streams).toHaveProperty('crypto')
      expect(client.streams.crypto).toHaveProperty('connect')
      expect(client.streams.crypto).toHaveProperty('subscribeForTrades')
    })

    it('should have tradeUpdates stream', () => {
      const client = createAlpacaClient(testConfig)

      expect(client.streams).toHaveProperty('tradeUpdates')
      expect(client.streams.tradeUpdates).toHaveProperty('connect')
      expect(client.streams.tradeUpdates).toHaveProperty('subscribe')
      expect(client.streams.tradeUpdates).toHaveProperty('onTradeUpdate')
    })
  })

  describe('config handling', () => {
    it('should work with minimal config', () => {
      const minimalConfig: AlpacaClientConfig = {
        keyId: 'key',
        secretKey: 'secret',
      }

      const client = createAlpacaClient(minimalConfig)

      expect(client).toBeDefined()
      expect(client.trading).toBeDefined()
    })

    it('should work with live trading config', () => {
      const liveConfig: AlpacaClientConfig = {
        keyId: 'live-key',
        secretKey: 'live-secret',
        paper: false,
      }

      const client = createAlpacaClient(liveConfig)

      expect(client).toBeDefined()
    })

    it('should work with custom timeout and retries', () => {
      const customConfig: AlpacaClientConfig = {
        keyId: 'key',
        secretKey: 'secret',
        timeout: 60000,
        maxRetries: 5,
      }

      const client = createAlpacaClient(customConfig)

      expect(client).toBeDefined()
    })
  })

  describe('type checking', () => {
    it('should satisfy AlpacaClient interface', () => {
      const client: AlpacaClient = createAlpacaClient(testConfig)

      // Type check that all required properties exist
      expect(typeof client.trading).toBe('object')
      expect(typeof client.broker).toBe('object')
      expect(typeof client.marketData).toBe('object')
      expect(typeof client.streams).toBe('object')
    })
  })
})
