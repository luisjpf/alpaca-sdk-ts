/**
 * Unified Alpaca client
 */

import type { AlpacaConfig } from '@luisjpf/core'
import { createTradingClient } from '@luisjpf/trading'
import type { TradingClient } from '@luisjpf/trading'
import { createBrokerClient } from '@luisjpf/broker'
import type { BrokerClient } from '@luisjpf/broker'
import { createMarketDataClient } from '@luisjpf/market-data'
import type { MarketDataClient } from '@luisjpf/market-data'
import {
  createStockStream,
  createCryptoStream,
  createTradeUpdatesStream,
} from '@luisjpf/streaming'
import type { StockStream, CryptoStream, TradeUpdatesStream } from '@luisjpf/streaming'

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
