/**
 * Broker API client factory
 */

import createClient from 'openapi-fetch'
import {
  type AlpacaConfig,
  resolveConfig,
  createBasicAuth,
  type RequestOptions,
  unwrap,
  unwrapList,
  unwrapOptional,
} from '@alpaca-sdk/core'
import type { paths, components, operations } from './generated/broker-api'

// Account types
export type Account = components['schemas']['Account']
export type AccountExtended = components['schemas']['AccountExtended']
export type TradeAccount = components['schemas']['TradeAccount']
export type AccountStatus = components['schemas']['AccountStatus']
export type AccountConfigurations = components['schemas']['AccountConfigurations']
export type AccountCreationRequest = components['schemas']['AccountCreationRequest']
export type AccountUpdateRequest = components['schemas']['AccountUpdateRequest']

// Activity types
export type Activity = components['schemas']['Activity']
export type TradeActivity = components['schemas']['TradeActivity']
export type NonTradeActivity = components['schemas']['NonTradeActivity']
export type ActivityType = components['schemas']['ActivityType']

// Order types
export type Order = components['schemas']['Order']
export type CreateOrderRequest = components['schemas']['CreateOrderRequest']
export type OrderSide = components['schemas']['OrderSide']
export type OrderType = components['schemas']['OrderType']
export type TimeInForce = components['schemas']['TimeInForce']
export type OrderClass = components['schemas']['OrderClass']
export type OrderStatus = components['schemas']['OrderStatus']

// Position types
export type Position = components['schemas']['Position']

// Transfer types
export type Transfer = components['schemas']['Transfer']
export type CreateTransferRequest = components['schemas']['CreateTransferRequest']
export type TransferDirection = components['schemas']['TransferDirection']
export type TransferType = components['schemas']['TransferType']

// ACH types
export type ACHRelationship = components['schemas']['ACHRelationship']
export type CreateACHRelationshipRequest = components['schemas']['CreateACHRelationshipRequest']

// Document types
export type AccountDocument = components['schemas']['AccountDocument']
export type OwnerDocument = components['schemas']['OwnerDocument']

// Identity types
export type Contact = components['schemas']['Contact']
export type Identity = components['schemas']['Identity']
export type Disclosures = components['schemas']['Disclosures']
export type TrustedContact = components['schemas']['TrustedContact']

// Calendar and Clock
export type Calendar = components['schemas']['Calendar']
export type Clock = components['schemas']['Clock']

export type BrokerClientConfig = AlpacaConfig

/**
 * Create a Broker API client
 */
export function createBrokerClient(config: BrokerClientConfig) {
  const resolvedConfig = resolveConfig(config, 'broker')
  const auth = createBasicAuth(resolvedConfig.keyId, resolvedConfig.secretKey)

  const client = createClient<paths>({
    baseUrl: resolvedConfig.baseUrl,
    headers: auth,
  })

  return {
    /** Raw openapi-fetch client for advanced usage */
    raw: client,

    /** Account operations */
    accounts: {
      /** List all accounts */
      async list(
        params?: operations['getAllAccounts']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(await client.GET('/v1/accounts', {
          params: { query: params },
          signal: options?.signal,
        }))
      },

      /** Get account by ID */
      async get(accountId: string, options?: RequestOptions) {
        return unwrap(await client.GET('/v1/accounts/{account_id}', {
          params: { path: { account_id: accountId } },
          signal: options?.signal,
        }))
      },

      /** Create a new account */
      async create(account: AccountCreationRequest, options?: RequestOptions) {
        return unwrap(await client.POST('/v1/accounts', {
          body: account,
          signal: options?.signal,
        }))
      },

      /** Update an account */
      async update(
        accountId: string,
        updates: AccountUpdateRequest,
        options?: RequestOptions
      ) {
        return unwrap(await client.PATCH('/v1/accounts/{account_id}', {
          params: { path: { account_id: accountId } },
          body: updates,
          signal: options?.signal,
        }))
      },

      /** Get trading account details */
      async getTradingAccount(accountId: string, options?: RequestOptions) {
        return unwrap(await client.GET('/v1/trading/accounts/{account_id}/account', {
          params: { path: { account_id: accountId } },
          signal: options?.signal,
        }))
      },
    },

    /** Account activities */
    activities: {
      /** Get activities across all accounts */
      async list(
        params?: operations['getAccountActivities']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(await client.GET('/v1/accounts/activities', {
          params: { query: params },
          signal: options?.signal,
        }))
      },

      /** Get activities by type */
      async getByType(
        activityType: ActivityType,
        params?: operations['getAccountActivitiesByType']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(await client.GET('/v1/accounts/activities/{activity_type}', {
          params: { path: { activity_type: activityType }, query: params },
          signal: options?.signal,
        }))
      },
    },

    /** Transfer operations */
    transfers: {
      /** Get transfers for an account */
      async list(
        accountId: string,
        params?: operations['getTransfersForAccount']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(await client.GET('/v1/accounts/{account_id}/transfers', {
          params: { path: { account_id: accountId }, query: params },
          signal: options?.signal,
        }))
      },

      /** Create a transfer */
      async create(
        accountId: string,
        transfer: CreateTransferRequest,
        options?: RequestOptions
      ) {
        return unwrap(await client.POST('/v1/accounts/{account_id}/transfers', {
          params: { path: { account_id: accountId } },
          body: transfer,
          signal: options?.signal,
        }))
      },

      /** Delete/cancel a transfer */
      async delete(
        accountId: string,
        transferId: string,
        options?: RequestOptions
      ) {
        unwrapOptional(await client.DELETE('/v1/accounts/{account_id}/transfers/{transfer_id}', {
          params: { path: { account_id: accountId, transfer_id: transferId } },
          signal: options?.signal,
        }))
      },
    },

    /** ACH relationship operations */
    achRelationships: {
      /** Get ACH relationships for an account */
      async list(accountId: string, options?: RequestOptions) {
        return unwrapList(await client.GET('/v1/accounts/{account_id}/ach_relationships', {
          params: { path: { account_id: accountId } },
          signal: options?.signal,
        }))
      },

      /** Create an ACH relationship */
      async create(
        accountId: string,
        relationship: CreateACHRelationshipRequest,
        options?: RequestOptions
      ) {
        return unwrap(await client.POST('/v1/accounts/{account_id}/ach_relationships', {
          params: { path: { account_id: accountId } },
          body: relationship,
          signal: options?.signal,
        }))
      },

      /** Delete an ACH relationship */
      async delete(
        accountId: string,
        achRelationshipId: string,
        options?: RequestOptions
      ) {
        unwrapOptional(await client.DELETE('/v1/accounts/{account_id}/ach_relationships/{ach_relationship_id}', {
          params: { path: { account_id: accountId, ach_relationship_id: achRelationshipId } },
          signal: options?.signal,
        }))
      },
    },

    /** Trading operations on behalf of accounts */
    trading: {
      /** Orders */
      orders: {
        /** List orders for an account */
        async list(
          accountId: string,
          params?: operations['getAllOrdersForAccount']['parameters']['query'],
          options?: RequestOptions
        ) {
          return unwrapList(await client.GET('/v1/trading/accounts/{account_id}/orders', {
            params: { path: { account_id: accountId }, query: params },
            signal: options?.signal,
          }))
        },

        /** Get order by ID */
        async get(
          accountId: string,
          orderId: string,
          options?: RequestOptions
        ) {
          return unwrap(await client.GET('/v1/trading/accounts/{account_id}/orders/{order_id}', {
            params: { path: { account_id: accountId, order_id: orderId } },
            signal: options?.signal,
          }))
        },

        /** Create an order */
        async create(
          accountId: string,
          order: CreateOrderRequest,
          options?: RequestOptions
        ) {
          return unwrap(await client.POST('/v1/trading/accounts/{account_id}/orders', {
            params: { path: { account_id: accountId } },
            body: order,
            signal: options?.signal,
          }))
        },

        /** Replace an order */
        async replace(
          accountId: string,
          orderId: string,
          updates: operations['replaceOrderForAccount']['requestBody']['content']['application/json'],
          options?: RequestOptions
        ) {
          return unwrap(await client.PATCH('/v1/trading/accounts/{account_id}/orders/{order_id}', {
            params: { path: { account_id: accountId, order_id: orderId } },
            body: updates,
            signal: options?.signal,
          }))
        },

        /** Cancel an order */
        async cancel(
          accountId: string,
          orderId: string,
          options?: RequestOptions
        ) {
          unwrapOptional(await client.DELETE('/v1/trading/accounts/{account_id}/orders/{order_id}', {
            params: { path: { account_id: accountId, order_id: orderId } },
            signal: options?.signal,
          }))
        },

        /** Cancel all orders */
        async cancelAll(accountId: string, options?: RequestOptions) {
          return unwrapList(await client.DELETE('/v1/trading/accounts/{account_id}/orders', {
            params: { path: { account_id: accountId } },
            signal: options?.signal,
          }))
        },
      },

      /** Positions */
      positions: {
        /** List positions for an account */
        async list(accountId: string, options?: RequestOptions) {
          return unwrapList(await client.GET('/v1/trading/accounts/{account_id}/positions', {
            params: { path: { account_id: accountId } },
            signal: options?.signal,
          }))
        },

        /** Get position by symbol */
        async get(
          accountId: string,
          symbolOrAssetId: string,
          options?: RequestOptions
        ) {
          return unwrap(await client.GET('/v1/trading/accounts/{account_id}/positions/{symbol_or_asset_id}', {
            params: { path: { account_id: accountId, symbol_or_asset_id: symbolOrAssetId } },
            signal: options?.signal,
          }))
        },

        /** Close a position */
        async close(
          accountId: string,
          symbolOrAssetId: string,
          params?: operations['closePositionForAccountBySymbol']['parameters']['query'],
          options?: RequestOptions
        ) {
          return unwrap(await client.DELETE('/v1/trading/accounts/{account_id}/positions/{symbol_or_asset_id}', {
            params: {
              path: { account_id: accountId, symbol_or_asset_id: symbolOrAssetId },
              query: params,
            },
            signal: options?.signal,
          }))
        },

        /** Close all positions */
        async closeAll(
          accountId: string,
          params?: operations['closeAllPositionsForAccount']['parameters']['query'],
          options?: RequestOptions
        ) {
          return unwrapList(await client.DELETE('/v1/trading/accounts/{account_id}/positions', {
            params: { path: { account_id: accountId }, query: params },
            signal: options?.signal,
          }))
        },
      },
    },

    /** Document operations */
    documents: {
      /** Get documents for an account */
      async list(
        accountId: string,
        params?: operations['getDocsForAccount']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(await client.GET('/v1/accounts/{account_id}/documents', {
          params: { path: { account_id: accountId }, query: params },
          signal: options?.signal,
        }))
      },

      /** Download a document */
      async download(
        accountId: string,
        documentId: string,
        options?: RequestOptions
      ) {
        return unwrap(await client.GET('/v1/accounts/{account_id}/documents/{document_id}/download', {
          params: { path: { account_id: accountId, document_id: documentId } },
          signal: options?.signal,
        }))
      },
    },

    /** Asset operations */
    assets: {
      /** List all assets */
      async list(
        params?: operations['getAssets']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(await client.GET('/v1/assets', {
          params: { query: params },
          signal: options?.signal,
        }))
      },

      /** Get asset by symbol or ID */
      async get(symbolOrAssetId: string, options?: RequestOptions) {
        return unwrap(await client.GET('/v1/assets/{symbol_or_asset_id}', {
          params: { path: { symbol_or_asset_id: symbolOrAssetId } },
          signal: options?.signal,
        }))
      },
    },

    /** Calendar operations */
    calendar: {
      /** Get market calendar */
      async get(
        params?: operations['queryMarketCalendar']['parameters']['query'],
        options?: RequestOptions
      ) {
        return unwrapList(await client.GET('/v1/calendar', {
          params: { query: params },
          signal: options?.signal,
        }))
      },
    },

    /** Clock operations */
    clock: {
      /** Get market clock */
      async get(options?: RequestOptions) {
        return unwrap(await client.GET('/v1/clock', {
          signal: options?.signal,
        }))
      },
    },
  }
}

/** Type inference helper for the broker client */
export type BrokerClient = ReturnType<typeof createBrokerClient>
