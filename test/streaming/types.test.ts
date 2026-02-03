/**
 * Unit tests for streaming type guards
 */

import { describe, it, expect } from 'vitest'
import { isTrade, isQuote, isBar } from '../../src/streaming/types'
import type { Trade, Quote, Bar } from '../../src/streaming/types'

describe('streaming type guards', () => {
  describe('isTrade', () => {
    it('should return true for valid trade messages', () => {
      const trade: Trade = {
        T: 't',
        S: 'AAPL',
        i: 12345,
        x: 'V',
        p: 150.25,
        s: 100,
        t: '2024-01-15T10:30:00Z',
        c: ['@'],
        z: 'A',
      }

      expect(isTrade(trade)).toBe(true)
    })

    it('should return false for quote messages', () => {
      const quote: Quote = {
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
      }

      expect(isTrade(quote)).toBe(false)
    })

    it('should return false for bar messages', () => {
      const bar: Bar = {
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
      }

      expect(isTrade(bar)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isTrade(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isTrade(undefined)).toBe(false)
    })

    it('should return false for non-objects', () => {
      expect(isTrade('string')).toBe(false)
      expect(isTrade(123)).toBe(false)
      expect(isTrade(true)).toBe(false)
    })

    it('should return false for objects without T property', () => {
      expect(isTrade({ S: 'AAPL' })).toBe(false)
    })

    it('should return false for objects with wrong T value', () => {
      expect(isTrade({ T: 'x', S: 'AAPL' })).toBe(false)
    })
  })

  describe('isQuote', () => {
    it('should return true for valid quote messages', () => {
      const quote: Quote = {
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
      }

      expect(isQuote(quote)).toBe(true)
    })

    it('should return false for trade messages', () => {
      const trade: Trade = {
        T: 't',
        S: 'AAPL',
        i: 12345,
        x: 'V',
        p: 150.25,
        s: 100,
        t: '2024-01-15T10:30:00Z',
        c: ['@'],
        z: 'A',
      }

      expect(isQuote(trade)).toBe(false)
    })

    it('should return false for bar messages', () => {
      const bar: Bar = {
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
      }

      expect(isQuote(bar)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isQuote(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isQuote(undefined)).toBe(false)
    })

    it('should return false for non-objects', () => {
      expect(isQuote('string')).toBe(false)
      expect(isQuote(123)).toBe(false)
    })

    it('should return false for objects without T property', () => {
      expect(isQuote({ S: 'AAPL' })).toBe(false)
    })

    it('should return false for objects with wrong T value', () => {
      expect(isQuote({ T: 'x', S: 'AAPL' })).toBe(false)
    })
  })

  describe('isBar', () => {
    it('should return true for valid bar messages', () => {
      const bar: Bar = {
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
      }

      expect(isBar(bar)).toBe(true)
    })

    it('should return false for trade messages', () => {
      const trade: Trade = {
        T: 't',
        S: 'AAPL',
        i: 12345,
        x: 'V',
        p: 150.25,
        s: 100,
        t: '2024-01-15T10:30:00Z',
        c: ['@'],
        z: 'A',
      }

      expect(isBar(trade)).toBe(false)
    })

    it('should return false for quote messages', () => {
      const quote: Quote = {
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
      }

      expect(isBar(quote)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isBar(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isBar(undefined)).toBe(false)
    })

    it('should return false for non-objects', () => {
      expect(isBar('string')).toBe(false)
      expect(isBar(123)).toBe(false)
    })

    it('should return false for objects without T property', () => {
      expect(isBar({ S: 'AAPL' })).toBe(false)
    })

    it('should return false for objects with wrong T value', () => {
      expect(isBar({ T: 'x', S: 'AAPL' })).toBe(false)
    })
  })
})
