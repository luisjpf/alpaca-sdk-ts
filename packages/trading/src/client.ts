/**
 * Trading API client factory
 */

import createClient from 'openapi-fetch'
import {
  type AlpacaConfig,
  resolveConfig,
  createApiKeyAuth,
  type RequestOptions,
  unwrap,
  unwrapList,
  unwrapOptional,
} from '@alpaca-sdk/core'
import type { paths, components, operations } from './generated/trading-api'

// Re-export schema types for consumers
export type Account = components['schemas']['Account']
export type Order = components['schemas']['Order']
export type Position = components['schemas']['Position']
export type Clock = components['schemas']['Clock']
export type Calendar = components['schemas']['Calendar']
export type Watchlist = components['schemas']['Watchlist']
export type PortfolioHistory = components['schemas']['PortfolioHistory']
export type AccountConfigurations = components['schemas']['AccountConfigurations']

// Asset type from the Assets schema
export type Asset = components['schemas']['Assets']

// Activity types - union of trading and non-trade activities
export type TradingActivity = components['schemas']['TradingActivities']
export type NonTradeActivity = components['schemas']['NonTradeActivities']
export type AccountActivity = TradingActivity | NonTradeActivity

// Order-related types
export type OrderSide = components['schemas']['OrderSide']
export type OrderType = components['schemas']['OrderType']
export type TimeInForce = components['schemas']['TimeInForce']
export type OrderClass = components['schemas']['OrderClass']

// Derive OrderRequest from the POST /v2/orders operation
export type OrderRequest = NonNullable<
  operations['postOrder']['requestBody']
>['content']['application/json']

// Derive PatchOrderRequest from schema
export type PatchOrderRequest = components['schemas']['PatchOrderRequest']

export type TradingClientConfig = AlpacaConfig

/**
 * Create a Trading API client
 */
export function createTradingClient(config: TradingClientConfig) {
  const resolvedConfig = resolveConfig(config, 'trading')
  const auth = createApiKeyAuth(resolvedConfig.keyId, resolvedConfig.secretKey)

  const client = createClient<paths>({
    baseUrl: resolvedConfig.baseUrl,
    headers: auth,
  })

  return {
    /** Raw openapi-fetch client for advanced usage */
    raw: client,

    /** Account operations */
    account: {
      /** Get account information */
      async get(options?: RequestOptions) {
        return unwrap(
          await client.GET('/v2/account', {
            signal: options?.signal,
          })
        )
      },

      /** Get account configurations */
      async getConfigurations(options?: RequestOptions) {
        return unwrap(
          await client.GET('/v2/account/configurations', {
            signal: options?.signal,
          })
        )
      },

      /** Update account configurations */
      async updateConfigurations(
        updates: Partial<AccountConfigurations>,
        options?: RequestOptions
      ) {
        return unwrap(
          await client.PATCH('/v2/account/configurations', {
            body: updates,
            signal: options?.signal,
          })
        )
      },

      /** Get account activities */
      async getActivities(
        params?: operations['getAccountActivities']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(
          await client.GET('/v2/account/activities', {
            params: { query: params },
            signal: options?.signal,
          })
        )
      },

      /** Get portfolio history */
      async getPortfolioHistory(
        params?: operations['getAccountPortfolioHistory']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrap(
          await client.GET('/v2/account/portfolio/history', {
            params: { query: params },
            signal: options?.signal,
          })
        )
      },
    },

    /** Order operations */
    orders: {
      /** List all orders */
      async list(
        params?: operations['getAllOrders']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(
          await client.GET('/v2/orders', {
            params: { query: params },
            signal: options?.signal,
          })
        )
      },

      /** Get order by ID */
      async get(orderId: string, options?: RequestOptions) {
        return unwrap(
          await client.GET('/v2/orders/{order_id}', {
            params: { path: { order_id: orderId } },
            signal: options?.signal,
          })
        )
      },

      /** Get order by client order ID */
      async getByClientOrderId(clientOrderId: string, options?: RequestOptions) {
        return unwrap(
          await client.GET('/v2/orders:by_client_order_id', {
            params: { query: { client_order_id: clientOrderId } },
            signal: options?.signal,
          })
        )
      },

      /** Create a new order */
      async create(order: OrderRequest, options?: RequestOptions) {
        return unwrap(
          await client.POST('/v2/orders', {
            body: order,
            signal: options?.signal,
          })
        )
      },

      /** Replace an existing order */
      async replace(orderId: string, updates: PatchOrderRequest, options?: RequestOptions) {
        return unwrap(
          await client.PATCH('/v2/orders/{order_id}', {
            params: { path: { order_id: orderId } },
            body: updates,
            signal: options?.signal,
          })
        )
      },

      /** Cancel an order */
      async cancel(orderId: string, options?: RequestOptions) {
        unwrapOptional(
          await client.DELETE('/v2/orders/{order_id}', {
            params: { path: { order_id: orderId } },
            signal: options?.signal,
          })
        )
      },

      /** Cancel all open orders */
      async cancelAll(options?: RequestOptions) {
        return unwrapList(
          await client.DELETE('/v2/orders', {
            signal: options?.signal,
          })
        )
      },
    },

    /** Position operations */
    positions: {
      /** List all open positions */
      async list(options?: RequestOptions) {
        return unwrapList(
          await client.GET('/v2/positions', {
            signal: options?.signal,
          })
        )
      },

      /** Get position by symbol or asset ID */
      async get(symbolOrAssetId: string, options?: RequestOptions) {
        return unwrap(
          await client.GET('/v2/positions/{symbol_or_asset_id}', {
            params: { path: { symbol_or_asset_id: symbolOrAssetId } },
            signal: options?.signal,
          })
        )
      },

      /** Close a position */
      async close(
        symbolOrAssetId: string,
        params?: operations['deleteOpenPosition']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrap(
          await client.DELETE('/v2/positions/{symbol_or_asset_id}', {
            params: {
              path: { symbol_or_asset_id: symbolOrAssetId },
              query: params,
            },
            signal: options?.signal,
          })
        )
      },

      /** Close all positions */
      async closeAll(
        params?: operations['deleteAllOpenPositions']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(
          await client.DELETE('/v2/positions', {
            params: { query: params },
            signal: options?.signal,
          })
        )
      },
    },

    /** Asset operations */
    assets: {
      /** List all assets */
      async list(
        params?: operations['get-v2-assets']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(
          await client.GET('/v2/assets', {
            params: { query: params },
            signal: options?.signal,
          })
        )
      },

      /** Get asset by symbol or ID */
      async get(symbolOrAssetId: string, options?: RequestOptions) {
        return unwrap(
          await client.GET('/v2/assets/{symbol_or_asset_id}', {
            params: { path: { symbol_or_asset_id: symbolOrAssetId } },
            signal: options?.signal,
          })
        )
      },
    },

    /** Clock operations */
    clock: {
      /** Get market clock */
      async get(options?: RequestOptions) {
        return unwrap(
          await client.GET('/v2/clock', {
            signal: options?.signal,
          })
        )
      },
    },

    /** Calendar operations */
    calendar: {
      /** Get market calendar */
      async get(
        params?: operations['getCalendar']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(
          await client.GET('/v2/calendar', {
            params: { query: params },
            signal: options?.signal,
          })
        )
      },
    },

    /** Watchlist operations */
    watchlists: {
      /** List all watchlists */
      async list(options?: RequestOptions) {
        return unwrapList(
          await client.GET('/v2/watchlists', {
            signal: options?.signal,
          })
        )
      },

      /** Get watchlist by ID */
      async get(watchlistId: string, options?: RequestOptions) {
        return unwrap(
          await client.GET('/v2/watchlists/{watchlist_id}', {
            params: { path: { watchlist_id: watchlistId } },
            signal: options?.signal,
          })
        )
      },

      /** Create a new watchlist */
      async create(params: { name: string; symbols?: string[] }, options?: RequestOptions) {
        return unwrap(
          await client.POST('/v2/watchlists', {
            body: { name: params.name, symbols: params.symbols ?? [] },
            signal: options?.signal,
          })
        )
      },

      /** Update a watchlist */
      async update(
        watchlistId: string,
        params: { name: string; symbols?: string[] },
        options?: RequestOptions
      ) {
        return unwrap(
          await client.PUT('/v2/watchlists/{watchlist_id}', {
            params: { path: { watchlist_id: watchlistId } },
            body: { name: params.name, symbols: params.symbols ?? [] },
            signal: options?.signal,
          })
        )
      },

      /** Add symbol to watchlist */
      async addSymbol(watchlistId: string, symbol: string, options?: RequestOptions) {
        return unwrap(
          await client.POST('/v2/watchlists/{watchlist_id}', {
            params: { path: { watchlist_id: watchlistId } },
            body: { symbol },
            signal: options?.signal,
          })
        )
      },

      /** Remove symbol from watchlist */
      async removeSymbol(watchlistId: string, symbol: string, options?: RequestOptions) {
        return unwrap(
          await client.DELETE('/v2/watchlists/{watchlist_id}/{symbol}', {
            params: { path: { watchlist_id: watchlistId, symbol } },
            signal: options?.signal,
          })
        )
      },

      /** Delete a watchlist */
      async delete(watchlistId: string, options?: RequestOptions) {
        unwrapOptional(
          await client.DELETE('/v2/watchlists/{watchlist_id}', {
            params: { path: { watchlist_id: watchlistId } },
            signal: options?.signal,
          })
        )
      },
    },
  }
}

/** Type inference helper for the trading client */
export type TradingClient = ReturnType<typeof createTradingClient>
