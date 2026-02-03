/**
 * Subscription manager for market data streams
 *
 * Handles subscription tracking and deduplication for trades, quotes, and bars.
 */

import type { MarketDataSubscription } from './types'

export type SubscriptionType = 'trades' | 'quotes' | 'bars'

/**
 * Manages subscriptions for a market data stream.
 * Tracks subscribed symbols and handles deduplication.
 */
export class SubscriptionManager {
  private subscribedTrades = new Set<string>()
  private subscribedQuotes = new Set<string>()
  private subscribedBars = new Set<string>()

  private getSet(type: SubscriptionType): Set<string> {
    switch (type) {
      case 'trades':
        return this.subscribedTrades
      case 'quotes':
        return this.subscribedQuotes
      case 'bars':
        return this.subscribedBars
    }
  }

  /**
   * Track symbols as subscribed and return only new symbols that weren't already subscribed.
   * Returns null if there are no new symbols to subscribe to.
   */
  subscribe(type: SubscriptionType, symbols: string[]): MarketDataSubscription | null {
    const set = this.getSet(type)
    const newSymbols = symbols.filter((s) => !set.has(s))

    if (newSymbols.length === 0) {
      return null
    }

    for (const symbol of newSymbols) {
      set.add(symbol)
    }

    return {
      action: 'subscribe',
      [type]: newSymbols,
    }
  }

  /**
   * Untrack symbols and return only symbols that were actually subscribed.
   * Returns null if there are no symbols to unsubscribe from.
   */
  unsubscribe(type: SubscriptionType, symbols: string[]): MarketDataSubscription | null {
    const set = this.getSet(type)
    const existingSymbols = symbols.filter((s) => set.has(s))

    if (existingSymbols.length === 0) {
      return null
    }

    for (const symbol of existingSymbols) {
      set.delete(symbol)
    }

    return {
      action: 'unsubscribe',
      [type]: existingSymbols,
    }
  }

  /**
   * Clear all subscriptions (e.g., on disconnect)
   */
  clear(): void {
    this.subscribedTrades.clear()
    this.subscribedQuotes.clear()
    this.subscribedBars.clear()
  }

  /**
   * Get all currently subscribed symbols for a type
   */
  getSubscribed(type: SubscriptionType): string[] {
    return Array.from(this.getSet(type))
  }

  /**
   * Check if a symbol is subscribed for a type
   */
  isSubscribed(type: SubscriptionType, symbol: string): boolean {
    return this.getSet(type).has(symbol)
  }

  /**
   * Check if there are any subscriptions
   */
  hasSubscriptions(): boolean {
    return (
      this.subscribedTrades.size > 0 ||
      this.subscribedQuotes.size > 0 ||
      this.subscribedBars.size > 0
    )
  }

  /**
   * Get subscription messages to restore all current subscriptions.
   * Useful for re-subscribing after reconnection.
   * Clears internal state after generating messages (call before reconnect).
   */
  getResubscribeMessages(): MarketDataSubscription[] {
    const messages: MarketDataSubscription[] = []

    if (this.subscribedTrades.size > 0) {
      messages.push({
        action: 'subscribe',
        trades: Array.from(this.subscribedTrades),
      })
    }

    if (this.subscribedQuotes.size > 0) {
      messages.push({
        action: 'subscribe',
        quotes: Array.from(this.subscribedQuotes),
      })
    }

    if (this.subscribedBars.size > 0) {
      messages.push({
        action: 'subscribe',
        bars: Array.from(this.subscribedBars),
      })
    }

    return messages
  }
}
