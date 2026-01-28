/**
 * Unified Alpaca client
 */

import type { AlpacaConfig } from './core'
import { createTradingClient } from './trading'
import type { TradingClient } from './trading'
import { createBrokerClient } from './broker'
import type { BrokerClient } from './broker'
import { createMarketDataClient } from './market-data'
import type { MarketDataClient } from './market-data'
import { createStockStream, createCryptoStream, createTradeUpdatesStream } from './streaming'
import type { StockStream, CryptoStream, TradeUpdatesStream } from './streaming'

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
