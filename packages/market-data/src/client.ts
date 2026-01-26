/**
 * Market Data API client factory
 */

import createClient from 'openapi-fetch'
import {
  type AlpacaConfig,
  resolveConfig,
  createApiKeyAuth,
  type RequestOptions,
} from '@alpaca-sdk/core'
import type { paths, components, operations } from './generated/market-data-api'

// Stock data types
export type StockBar = components['schemas']['stock_bar']
export type StockTrade = components['schemas']['stock_trade']
export type StockQuote = components['schemas']['stock_quote']
export type StockSnapshot = components['schemas']['stock_snapshot']
export type StockAuction = components['schemas']['stock_auction']

// Crypto data types
export type CryptoBar = components['schemas']['crypto_bar']
export type CryptoTrade = components['schemas']['crypto_trade']
export type CryptoQuote = components['schemas']['crypto_quote']
export type CryptoSnapshot = components['schemas']['crypto_snapshot']
export type CryptoOrderbook = components['schemas']['crypto_orderbook']

// Options data types
export type OptionBar = components['schemas']['option_bar']
export type OptionTrade = components['schemas']['option_trade']
export type OptionQuote = components['schemas']['option_quote']
export type OptionSnapshot = components['schemas']['option_snapshot']
export type OptionGreeks = components['schemas']['option_greeks']

// News types
export type News = components['schemas']['news']
export type NewsImage = components['schemas']['news_image']

// Screener types
export type MostActive = components['schemas']['most_active']
export type Mover = components['schemas']['mover']

// Corporate actions
export type CorporateActions = components['schemas']['corporate_actions']

export type MarketDataClientConfig = AlpacaConfig

/**
 * Create a Market Data API client
 */
export function createMarketDataClient(config: MarketDataClientConfig) {
  const resolvedConfig = resolveConfig(config, 'marketData')
  const auth = createApiKeyAuth(resolvedConfig.keyId, resolvedConfig.secretKey)

  const client = createClient<paths>({
    baseUrl: resolvedConfig.baseUrl,
    headers: auth,
  })

  return {
    /** Raw openapi-fetch client for advanced usage */
    raw: client,

    /** Stock market data operations */
    stocks: {
      /** Get historical bars for multiple symbols */
      async getBars(
        params: operations['StockBars']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/bars', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get historical bars for a single symbol */
      async getSymbolBars(
        symbol: string,
        params: NonNullable<operations['StockBarSingle']['parameters']['query']>,
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/{symbol}/bars', {
          params: { path: { symbol }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest bars for multiple symbols */
      async getLatestBars(
        params: operations['StockLatestBars']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/bars/latest', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest bar for a single symbol */
      async getLatestBar(
        symbol: string,
        params?: Omit<NonNullable<operations['StockLatestBarSingle']['parameters']['query']>, 'symbol'>,
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/{symbol}/bars/latest', {
          params: { path: { symbol }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get historical trades for multiple symbols */
      async getTrades(
        params: operations['StockTrades']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/trades', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get historical trades for a single symbol */
      async getSymbolTrades(
        symbol: string,
        params?: Omit<NonNullable<operations['StockTradeSingle']['parameters']['query']>, 'symbol'>,
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/{symbol}/trades', {
          params: { path: { symbol }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest trades for multiple symbols */
      async getLatestTrades(
        params: operations['StockLatestTrades']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/trades/latest', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest trade for a single symbol */
      async getLatestTrade(
        symbol: string,
        params?: Omit<NonNullable<operations['StockLatestTradeSingle']['parameters']['query']>, 'symbol'>,
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/{symbol}/trades/latest', {
          params: { path: { symbol }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get historical quotes for multiple symbols */
      async getQuotes(
        params: operations['StockQuotes']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/quotes', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get historical quotes for a single symbol */
      async getSymbolQuotes(
        symbol: string,
        params?: Omit<NonNullable<operations['StockQuoteSingle']['parameters']['query']>, 'symbol'>,
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/{symbol}/quotes', {
          params: { path: { symbol }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest quotes for multiple symbols */
      async getLatestQuotes(
        params: operations['StockLatestQuotes']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/quotes/latest', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest quote for a single symbol */
      async getLatestQuote(
        symbol: string,
        params?: Omit<NonNullable<operations['StockLatestQuoteSingle']['parameters']['query']>, 'symbol'>,
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/{symbol}/quotes/latest', {
          params: { path: { symbol }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get snapshots for multiple symbols */
      async getSnapshots(
        params: operations['StockSnapshots']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/snapshots', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get snapshot for a single symbol */
      async getSnapshot(
        symbol: string,
        params?: operations['StockSnapshotSingle']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/{symbol}/snapshot', {
          params: { path: { symbol }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get auctions for multiple symbols */
      async getAuctions(
        params: operations['StockAuctions']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/auctions', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get auctions for a single symbol */
      async getSymbolAuctions(
        symbol: string,
        params?: Omit<NonNullable<operations['StockAuctionSingle']['parameters']['query']>, 'symbol'>,
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/{symbol}/auctions', {
          params: { path: { symbol }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get exchange code mappings */
      async getExchanges(options?: RequestOptions) {
        const { data, error } = await client.GET('/v2/stocks/meta/exchanges', {
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get condition code mappings */
      async getConditions(
        ticktype: 'trade' | 'quote',
        params: NonNullable<operations['StockMetaConditions']['parameters']['query']>,
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v2/stocks/meta/conditions/{ticktype}', {
          params: { path: { ticktype }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },
    },

    /** Crypto market data operations */
    crypto: {
      /** Get historical bars */
      async getBars(
        loc: 'us' | 'us-1' | 'eu-1',
        params: operations['CryptoBars']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta3/crypto/{loc}/bars', {
          params: { path: { loc }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest bars */
      async getLatestBars(
        loc: 'us' | 'us-1' | 'eu-1',
        params: operations['CryptoLatestBars']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta3/crypto/{loc}/latest/bars', {
          params: { path: { loc }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get historical trades */
      async getTrades(
        loc: 'us' | 'us-1' | 'eu-1',
        params: operations['CryptoTrades']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta3/crypto/{loc}/trades', {
          params: { path: { loc }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest trades */
      async getLatestTrades(
        loc: 'us' | 'us-1' | 'eu-1',
        params: operations['CryptoLatestTrades']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta3/crypto/{loc}/latest/trades', {
          params: { path: { loc }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get historical quotes */
      async getQuotes(
        loc: 'us' | 'us-1' | 'eu-1',
        params: operations['CryptoQuotes']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta3/crypto/{loc}/quotes', {
          params: { path: { loc }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest quotes */
      async getLatestQuotes(
        loc: 'us' | 'us-1' | 'eu-1',
        params: operations['CryptoLatestQuotes']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta3/crypto/{loc}/latest/quotes', {
          params: { path: { loc }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get snapshots */
      async getSnapshots(
        loc: 'us' | 'us-1' | 'eu-1',
        params: operations['CryptoSnapshots']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta3/crypto/{loc}/snapshots', {
          params: { path: { loc }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest orderbooks */
      async getLatestOrderbooks(
        loc: 'us' | 'us-1' | 'eu-1',
        params: operations['CryptoLatestOrderbooks']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta3/crypto/{loc}/latest/orderbooks', {
          params: { path: { loc }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },
    },

    /** Options market data operations */
    options: {
      /** Get historical bars */
      async getBars(
        params: operations['optionBars']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/options/bars', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get historical trades */
      async getTrades(
        params: operations['OptionTrades']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/options/trades', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest trades */
      async getLatestTrades(
        params: operations['OptionLatestTrades']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/options/trades/latest', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get latest quotes */
      async getLatestQuotes(
        params: operations['OptionLatestQuotes']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/options/quotes/latest', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get snapshots for multiple symbols */
      async getSnapshots(
        params: operations['OptionSnapshots']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/options/snapshots', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get option chain for underlying symbol */
      async getChain(
        underlyingSymbol: string,
        params?: operations['OptionChain']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/options/snapshots/{underlying_symbol}', {
          params: { path: { underlying_symbol: underlyingSymbol }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get exchange code mappings */
      async getExchanges(options?: RequestOptions) {
        const { data, error } = await client.GET('/v1beta1/options/meta/exchanges', {
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get condition code mappings */
      async getConditions(
        ticktype: 'trade' | 'quote',
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/options/meta/conditions/{ticktype}', {
          params: { path: { ticktype } },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },
    },

    /** News operations */
    news: {
      /** Get news articles */
      async get(
        params?: operations['News']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/news', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },
    },

    /** Screener operations */
    screener: {
      /** Get most active stocks */
      async getMostActives(
        params?: operations['MostActives']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/screener/stocks/most-actives', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get market movers */
      async getMovers(
        marketType: 'stocks' | 'crypto',
        params?: operations['Movers']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/screener/{market_type}/movers', {
          params: { path: { market_type: marketType }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },
    },

    /** Corporate actions */
    corporateActions: {
      /** Get corporate actions */
      async get(
        params: operations['CorporateActions']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1/corporate-actions', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },
    },

    /** Forex operations */
    forex: {
      /** Get latest forex rates */
      async getLatestRates(
        params: operations['LatestRates']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/forex/latest/rates', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },

      /** Get historical forex rates */
      async getRates(
        params: operations['Rates']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/forex/rates', {
          params: { query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },
    },

    /** Logo operations */
    logos: {
      /** Get company logo */
      async get(
        symbol: string,
        params?: operations['Logos']['parameters']['query'],
        options?: RequestOptions
      ) {
        const { data, error } = await client.GET('/v1beta1/logos/{symbol}', {
          params: { path: { symbol }, query: params },
          signal: options?.signal,
        })
        if (error) throw error
        return data!
      },
    },
  }
}

/** Type inference helper for the market data client */
export type MarketDataClient = ReturnType<typeof createMarketDataClient>
