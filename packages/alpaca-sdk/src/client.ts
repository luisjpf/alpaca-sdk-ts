/**
 * Unified Alpaca client
 */

import type { AlpacaConfig } from '@alpaca-sdk/core'
import { createTradingClient } from '@alpaca-sdk/trading'
import type { TradingClient } from '@alpaca-sdk/trading'
import { createBrokerClient } from '@alpaca-sdk/broker'
import type { BrokerClient } from '@alpaca-sdk/broker'
import { createMarketDataClient } from '@alpaca-sdk/market-data'
import type { MarketDataClient } from '@alpaca-sdk/market-data'
import {
  createStockStream,
  createCryptoStream,
  createTradeUpdatesStream,
} from '@alpaca-sdk/streaming'
import type {
  StockStream,
  CryptoStream,
  TradeUpdatesStream,
} from '@alpaca-sdk/streaming'

export type AlpacaClientConfig = AlpacaConfig

export interface AlpacaClient {
  trading: TradingClient
  broker: BrokerClient
  marketData: MarketDataClient
  streams: {
    stocks: StockStream
    crypto: CryptoStream
    tradeUpdates: TradeUpdatesStream
  }
}

/**
 * Create a unified Alpaca client with all APIs
 */
export function createAlpacaClient(config: AlpacaClientConfig): AlpacaClient {
  const streamConfig = {
    keyId: config.keyId,
    secretKey: config.secretKey,
    paper: config.paper,
  }

  return {
    trading: createTradingClient(config),
    broker: createBrokerClient(config),
    marketData: createMarketDataClient(config),
    streams: {
      stocks: createStockStream(streamConfig),
      crypto: createCryptoStream(streamConfig),
      tradeUpdates: createTradeUpdatesStream(streamConfig),
    },
  }
}
