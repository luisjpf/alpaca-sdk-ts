/**
 * Unit tests for SubscriptionManager
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SubscriptionManager } from '../../src/streaming/subscription-manager'

describe('SubscriptionManager', () => {
  let manager: SubscriptionManager

  beforeEach(() => {
    manager = new SubscriptionManager()
  })

  describe('subscribe', () => {
    it('should return subscription message for new symbols', () => {
      const result = manager.subscribe('trades', ['AAPL', 'MSFT'])

      expect(result).toEqual({
        action: 'subscribe',
        trades: ['AAPL', 'MSFT'],
      })
    })

    it('should track subscribed symbols', () => {
      manager.subscribe('trades', ['AAPL'])

      expect(manager.isSubscribed('trades', 'AAPL')).toBe(true)
      expect(manager.isSubscribed('trades', 'MSFT')).toBe(false)
    })

    it('should return null when subscribing to already subscribed symbols', () => {
      manager.subscribe('trades', ['AAPL', 'MSFT'])
      const result = manager.subscribe('trades', ['AAPL', 'MSFT'])

      expect(result).toBeNull()
    })

    it('should only return new symbols when some are already subscribed', () => {
      manager.subscribe('trades', ['AAPL'])
      const result = manager.subscribe('trades', ['AAPL', 'MSFT', 'GOOG'])

      expect(result).toEqual({
        action: 'subscribe',
        trades: ['MSFT', 'GOOG'],
      })
    })

    it('should handle different subscription types independently', () => {
      manager.subscribe('trades', ['AAPL'])
      manager.subscribe('quotes', ['AAPL'])
      manager.subscribe('bars', ['AAPL'])

      expect(manager.isSubscribed('trades', 'AAPL')).toBe(true)
      expect(manager.isSubscribed('quotes', 'AAPL')).toBe(true)
      expect(manager.isSubscribed('bars', 'AAPL')).toBe(true)
    })

    it('should return correct message type for quotes', () => {
      const result = manager.subscribe('quotes', ['AAPL'])

      expect(result).toEqual({
        action: 'subscribe',
        quotes: ['AAPL'],
      })
    })

    it('should return correct message type for bars', () => {
      const result = manager.subscribe('bars', ['AAPL'])

      expect(result).toEqual({
        action: 'subscribe',
        bars: ['AAPL'],
      })
    })
  })

  describe('unsubscribe', () => {
    it('should return unsubscription message for subscribed symbols', () => {
      manager.subscribe('trades', ['AAPL', 'MSFT'])
      const result = manager.unsubscribe('trades', ['AAPL'])

      expect(result).toEqual({
        action: 'unsubscribe',
        trades: ['AAPL'],
      })
    })

    it('should remove symbols from tracking', () => {
      manager.subscribe('trades', ['AAPL', 'MSFT'])
      manager.unsubscribe('trades', ['AAPL'])

      expect(manager.isSubscribed('trades', 'AAPL')).toBe(false)
      expect(manager.isSubscribed('trades', 'MSFT')).toBe(true)
    })

    it('should return null when unsubscribing from non-subscribed symbols', () => {
      const result = manager.unsubscribe('trades', ['AAPL'])

      expect(result).toBeNull()
    })

    it('should only return subscribed symbols when some are not subscribed', () => {
      manager.subscribe('trades', ['AAPL', 'MSFT'])
      const result = manager.unsubscribe('trades', ['AAPL', 'GOOG', 'TSLA'])

      expect(result).toEqual({
        action: 'unsubscribe',
        trades: ['AAPL'],
      })
    })

    it('should return correct message type for quotes', () => {
      manager.subscribe('quotes', ['AAPL'])
      const result = manager.unsubscribe('quotes', ['AAPL'])

      expect(result).toEqual({
        action: 'unsubscribe',
        quotes: ['AAPL'],
      })
    })

    it('should return correct message type for bars', () => {
      manager.subscribe('bars', ['AAPL'])
      const result = manager.unsubscribe('bars', ['AAPL'])

      expect(result).toEqual({
        action: 'unsubscribe',
        bars: ['AAPL'],
      })
    })
  })

  describe('clear', () => {
    it('should clear all subscriptions', () => {
      manager.subscribe('trades', ['AAPL', 'MSFT'])
      manager.subscribe('quotes', ['GOOG'])
      manager.subscribe('bars', ['TSLA'])

      manager.clear()

      expect(manager.isSubscribed('trades', 'AAPL')).toBe(false)
      expect(manager.isSubscribed('trades', 'MSFT')).toBe(false)
      expect(manager.isSubscribed('quotes', 'GOOG')).toBe(false)
      expect(manager.isSubscribed('bars', 'TSLA')).toBe(false)
    })
  })

  describe('getSubscribed', () => {
    it('should return empty array when no subscriptions', () => {
      expect(manager.getSubscribed('trades')).toEqual([])
    })

    it('should return all subscribed symbols for a type', () => {
      manager.subscribe('trades', ['AAPL', 'MSFT', 'GOOG'])

      const subscribed = manager.getSubscribed('trades')

      expect(subscribed).toHaveLength(3)
      expect(subscribed).toContain('AAPL')
      expect(subscribed).toContain('MSFT')
      expect(subscribed).toContain('GOOG')
    })

    it('should return independent lists for different types', () => {
      manager.subscribe('trades', ['AAPL'])
      manager.subscribe('quotes', ['MSFT'])

      expect(manager.getSubscribed('trades')).toEqual(['AAPL'])
      expect(manager.getSubscribed('quotes')).toEqual(['MSFT'])
      expect(manager.getSubscribed('bars')).toEqual([])
    })
  })

  describe('isSubscribed', () => {
    it('should return false for non-subscribed symbols', () => {
      expect(manager.isSubscribed('trades', 'AAPL')).toBe(false)
    })

    it('should return true for subscribed symbols', () => {
      manager.subscribe('trades', ['AAPL'])

      expect(manager.isSubscribed('trades', 'AAPL')).toBe(true)
    })

    it('should return false after unsubscribing', () => {
      manager.subscribe('trades', ['AAPL'])
      manager.unsubscribe('trades', ['AAPL'])

      expect(manager.isSubscribed('trades', 'AAPL')).toBe(false)
    })
  })
})
