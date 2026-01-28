/**
 * Unit tests for Market Data API client
 *
 * These tests verify the market data client functionality using MSW to mock HTTP requests.
 * All external HTTP calls are intercepted, ensuring no real API calls are made.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createMarketDataClient } from '../../src/market-data/client'

const BASE_URL = 'https://data.alpaca.markets'

// Test credentials
const TEST_KEY_ID = 'test-key-id'
const TEST_SECRET_KEY = 'test-secret-key'

/**
 * Factory to create a market data client with test configuration
 */
function createTestClient() {
  return createMarketDataClient({
    keyId: TEST_KEY_ID,
    secretKey: TEST_SECRET_KEY,
    baseUrl: BASE_URL,
  })
}

// ============================================================================
// Mock Data Fixtures
// ============================================================================

const mockStockBar = {
  t: '2024-01-15T14:30:00Z',
  o: 150.25,
  h: 151.5,
  l: 149.75,
  c: 151.0,
  v: 1250000,
  n: 5432,
  vw: 150.65,
}

const mockStockTrade = {
  t: '2024-01-15T14:30:00Z',
  x: 'V',
  p: 150.5,
  s: 100,
  c: ['@', 'I'],
  i: 123456789,
  z: 'A',
}

const mockStockQuote = {
  t: '2024-01-15T14:30:00Z',
  ax: 'V',
  ap: 150.55,
  as: 200,
  bx: 'V',
  bp: 150.45,
  bs: 300,
  c: ['R'],
  z: 'A',
}

const mockStockSnapshot = {
  latestTrade: mockStockTrade,
  latestQuote: mockStockQuote,
  minuteBar: mockStockBar,
  dailyBar: mockStockBar,
  prevDailyBar: mockStockBar,
}

const mockCryptoBar = {
  t: '2024-01-15T14:30:00Z',
  o: 42500.0,
  h: 42750.0,
  l: 42250.0,
  c: 42600.0,
  v: 125.5,
  n: 1500,
  vw: 42550.25,
}

const mockCryptoTrade = {
  t: '2024-01-15T14:30:00Z',
  p: 42550.0,
  s: 0.5,
  tks: 'B',
  i: 987654321,
}

const mockNewsArticle = {
  id: 12345678,
  headline: 'Stock Market Reaches New Highs',
  author: 'Financial Reporter',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  summary: 'Markets continue their upward trajectory...',
  content: 'Full article content here...',
  url: 'https://example.com/news/article',
  images: [
    {
      size: 'large',
      url: 'https://example.com/image.jpg',
    },
  ],
  symbols: ['AAPL', 'MSFT', 'GOOGL'],
  source: 'benzinga',
}

const mockMostActive = {
  symbol: 'AAPL',
  volume: 85000000,
  trade_count: 450000,
}

const mockCryptoQuote = {
  t: '2024-01-15T14:30:00Z',
  bp: 42500.0,
  bs: 1.5,
  ap: 42510.0,
  as: 2.0,
}

const mockCryptoSnapshot = {
  latestTrade: mockCryptoTrade,
  latestQuote: mockCryptoQuote,
  minuteBar: mockCryptoBar,
  dailyBar: mockCryptoBar,
  prevDailyBar: mockCryptoBar,
}

const mockCryptoOrderbook = {
  t: '2024-01-15T14:30:00Z',
  b: [
    { p: 42500.0, s: 1.5 },
    { p: 42490.0, s: 2.0 },
  ],
  a: [
    { p: 42510.0, s: 1.0 },
    { p: 42520.0, s: 1.5 },
  ],
}

const mockStockAuction = {
  d: '2024-01-15',
  o: [{ t: '2024-01-15T14:30:00Z', x: 'V', p: 150.0, s: 1000 }],
  c: [{ t: '2024-01-15T20:00:00Z', x: 'V', p: 151.0, s: 2000 }],
}

const mockOptionBar = {
  t: '2024-01-15T14:30:00Z',
  o: 5.25,
  h: 5.75,
  l: 5.0,
  c: 5.5,
  v: 1500,
  n: 250,
  vw: 5.4,
}

const mockOptionTrade = {
  t: '2024-01-15T14:30:00Z',
  x: 'C',
  p: 5.5,
  s: 10,
  c: '@',
}

const mockOptionQuote = {
  t: '2024-01-15T14:30:00Z',
  ax: 'C',
  ap: 5.6,
  as: 20,
  bx: 'C',
  bp: 5.4,
  bs: 15,
  c: 'A',
}

const mockOptionSnapshot = {
  latestTrade: mockOptionTrade,
  latestQuote: mockOptionQuote,
}

const mockOptionGreeks = {
  delta: 0.45,
  gamma: 0.02,
  theta: -0.05,
  vega: 0.15,
  rho: 0.01,
}

const mockMover = {
  symbol: 'NVDA',
  price: 850.5,
  change: 25.75,
  percent_change: 3.12,
}

const mockCorporateAction = {
  id: 'ca-123456',
  corporate_actions_type: 'dividend',
  symbol: 'AAPL',
  declaration_date: '2024-01-01',
  ex_date: '2024-01-15',
  record_date: '2024-01-16',
  payable_date: '2024-02-01',
}

const mockForexRate = {
  t: '2024-01-15T14:30:00Z',
  o: 1.085,
  h: 1.0875,
  l: 1.0825,
  c: 1.086,
}

const mockExchangeMapping = {
  A: 'NYSE American (AMEX)',
  B: 'NASDAQ OMX BX',
  C: 'NYSE National',
  V: 'IEX',
}

const mockConditionMapping = {
  '@': 'Regular Sale',
  I: 'Odd Lot Trade',
}

const mockOptionsExchangeMapping = {
  A: 'NYSE American Options',
  C: 'CBOE',
  I: 'ISE',
}

// ============================================================================
// MSW Server Setup
// ============================================================================

const handlers = [
  // Stock Bars
  http.get(`${BASE_URL}/v2/stocks/bars`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    // Verify auth headers
    const keyId = request.headers.get('APCA-API-KEY-ID')
    const secretKey = request.headers.get('APCA-API-SECRET-KEY')

    if (keyId !== TEST_KEY_ID || secretKey !== TEST_SECRET_KEY) {
      return HttpResponse.json({ code: 40110000, message: 'Unauthorized' }, { status: 401 })
    }

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const bars: Record<string, (typeof mockStockBar)[]> = {}
    for (const symbol of symbolList) {
      bars[symbol] = [mockStockBar]
    }

    return HttpResponse.json({
      bars,
      next_page_token: null,
    })
  }),

  // Stock Latest Bars
  http.get(`${BASE_URL}/v2/stocks/bars/latest`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const bars: Record<string, typeof mockStockBar> = {}
    for (const symbol of symbolList) {
      bars[symbol] = mockStockBar
    }

    return HttpResponse.json({ bars })
  }),

  // Stock Trades
  http.get(`${BASE_URL}/v2/stocks/trades`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const trades: Record<string, (typeof mockStockTrade)[]> = {}
    for (const symbol of symbolList) {
      trades[symbol] = [mockStockTrade]
    }

    return HttpResponse.json({
      trades,
      next_page_token: null,
    })
  }),

  // Stock Quotes
  http.get(`${BASE_URL}/v2/stocks/quotes`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const quotes: Record<string, (typeof mockStockQuote)[]> = {}
    for (const symbol of symbolList) {
      quotes[symbol] = [mockStockQuote]
    }

    return HttpResponse.json({
      quotes,
      next_page_token: null,
    })
  }),

  // Stock Snapshots
  http.get(`${BASE_URL}/v2/stocks/snapshots`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const snapshots: Record<string, typeof mockStockSnapshot> = {}
    for (const symbol of symbolList) {
      snapshots[symbol] = mockStockSnapshot
    }

    return HttpResponse.json(snapshots)
  }),

  // Crypto Bars
  http.get(`${BASE_URL}/v1beta3/crypto/:loc/bars`, ({ request, params }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')
    const loc = params.loc

    if (!['us', 'us-1', 'eu-1'].includes(loc as string)) {
      return HttpResponse.json({ code: 40010000, message: 'Invalid location' }, { status: 400 })
    }

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const bars: Record<string, (typeof mockCryptoBar)[]> = {}
    for (const symbol of symbolList) {
      bars[symbol] = [mockCryptoBar]
    }

    return HttpResponse.json({
      bars,
      next_page_token: null,
    })
  }),

  // Crypto Trades
  http.get(`${BASE_URL}/v1beta3/crypto/:loc/trades`, ({ request, params }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')
    const loc = params.loc

    if (!['us', 'us-1', 'eu-1'].includes(loc as string)) {
      return HttpResponse.json({ code: 40010000, message: 'Invalid location' }, { status: 400 })
    }

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const trades: Record<string, (typeof mockCryptoTrade)[]> = {}
    for (const symbol of symbolList) {
      trades[symbol] = [mockCryptoTrade]
    }

    return HttpResponse.json({
      trades,
      next_page_token: null,
    })
  }),

  // News
  http.get(`${BASE_URL}/v1beta1/news`, () => {
    return HttpResponse.json({
      news: [mockNewsArticle],
      next_page_token: null,
    })
  }),

  // Screener - Most Actives
  http.get(`${BASE_URL}/v1beta1/screener/stocks/most-actives`, () => {
    return HttpResponse.json({
      most_actives: [mockMostActive],
      last_updated: '2024-01-15T16:00:00Z',
    })
  }),

  // Stock Symbol Bars (single symbol)
  http.get(`${BASE_URL}/v2/stocks/:symbol/bars`, ({ params }) => {
    const symbol = params.symbol as string
    return HttpResponse.json({
      bars: [mockStockBar],
      symbol,
      next_page_token: null,
    })
  }),

  // Stock Latest Bar (single symbol)
  http.get(`${BASE_URL}/v2/stocks/:symbol/bars/latest`, ({ params }) => {
    const symbol = params.symbol as string
    return HttpResponse.json({
      bar: mockStockBar,
      symbol,
    })
  }),

  // Stock Symbol Trades (single symbol)
  http.get(`${BASE_URL}/v2/stocks/:symbol/trades`, ({ params }) => {
    const symbol = params.symbol as string
    return HttpResponse.json({
      trades: [mockStockTrade],
      symbol,
      next_page_token: null,
    })
  }),

  // Stock Latest Trades (multiple symbols)
  http.get(`${BASE_URL}/v2/stocks/trades/latest`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const trades: Record<string, typeof mockStockTrade> = {}
    for (const symbol of symbolList) {
      trades[symbol] = mockStockTrade
    }

    return HttpResponse.json({ trades })
  }),

  // Stock Latest Trade (single symbol)
  http.get(`${BASE_URL}/v2/stocks/:symbol/trades/latest`, ({ params }) => {
    const symbol = params.symbol as string
    return HttpResponse.json({
      trade: mockStockTrade,
      symbol,
    })
  }),

  // Stock Symbol Quotes (single symbol)
  http.get(`${BASE_URL}/v2/stocks/:symbol/quotes`, ({ params }) => {
    const symbol = params.symbol as string
    return HttpResponse.json({
      quotes: [mockStockQuote],
      symbol,
      next_page_token: null,
    })
  }),

  // Stock Latest Quotes (multiple symbols)
  http.get(`${BASE_URL}/v2/stocks/quotes/latest`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const quotes: Record<string, typeof mockStockQuote> = {}
    for (const symbol of symbolList) {
      quotes[symbol] = mockStockQuote
    }

    return HttpResponse.json({ quotes })
  }),

  // Stock Latest Quote (single symbol)
  http.get(`${BASE_URL}/v2/stocks/:symbol/quotes/latest`, ({ params }) => {
    const symbol = params.symbol as string
    return HttpResponse.json({
      quote: mockStockQuote,
      symbol,
    })
  }),

  // Stock Snapshot (single symbol)
  http.get(`${BASE_URL}/v2/stocks/:symbol/snapshot`, ({ params }) => {
    const symbol = params.symbol as string
    return HttpResponse.json({
      ...mockStockSnapshot,
      symbol,
    })
  }),

  // Stock Auctions (multiple symbols)
  http.get(`${BASE_URL}/v2/stocks/auctions`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const auctions: Record<string, (typeof mockStockAuction)[]> = {}
    for (const symbol of symbolList) {
      auctions[symbol] = [mockStockAuction]
    }

    return HttpResponse.json({
      auctions,
      next_page_token: null,
    })
  }),

  // Stock Auctions (single symbol)
  http.get(`${BASE_URL}/v2/stocks/:symbol/auctions`, ({ params }) => {
    const symbol = params.symbol as string
    return HttpResponse.json({
      auctions: [mockStockAuction],
      symbol,
      next_page_token: null,
    })
  }),

  // Stock Meta - Exchanges
  http.get(`${BASE_URL}/v2/stocks/meta/exchanges`, () => {
    return HttpResponse.json(mockExchangeMapping)
  }),

  // Stock Meta - Conditions
  http.get(`${BASE_URL}/v2/stocks/meta/conditions/:ticktype`, () => {
    return HttpResponse.json(mockConditionMapping)
  }),

  // Crypto Latest Bars
  http.get(`${BASE_URL}/v1beta3/crypto/:loc/latest/bars`, ({ request, params }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')
    const loc = params.loc

    if (!['us', 'us-1', 'eu-1'].includes(loc as string)) {
      return HttpResponse.json({ code: 40010000, message: 'Invalid location' }, { status: 400 })
    }

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const bars: Record<string, typeof mockCryptoBar> = {}
    for (const symbol of symbolList) {
      bars[symbol] = mockCryptoBar
    }

    return HttpResponse.json({ bars })
  }),

  // Crypto Latest Trades
  http.get(`${BASE_URL}/v1beta3/crypto/:loc/latest/trades`, ({ request, params }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')
    const loc = params.loc

    if (!['us', 'us-1', 'eu-1'].includes(loc as string)) {
      return HttpResponse.json({ code: 40010000, message: 'Invalid location' }, { status: 400 })
    }

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const trades: Record<string, typeof mockCryptoTrade> = {}
    for (const symbol of symbolList) {
      trades[symbol] = mockCryptoTrade
    }

    return HttpResponse.json({ trades })
  }),

  // Crypto Quotes
  http.get(`${BASE_URL}/v1beta3/crypto/:loc/quotes`, ({ request, params }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')
    const loc = params.loc

    if (!['us', 'us-1', 'eu-1'].includes(loc as string)) {
      return HttpResponse.json({ code: 40010000, message: 'Invalid location' }, { status: 400 })
    }

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const quotes: Record<string, (typeof mockCryptoQuote)[]> = {}
    for (const symbol of symbolList) {
      quotes[symbol] = [mockCryptoQuote]
    }

    return HttpResponse.json({
      quotes,
      next_page_token: null,
    })
  }),

  // Crypto Latest Quotes
  http.get(`${BASE_URL}/v1beta3/crypto/:loc/latest/quotes`, ({ request, params }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')
    const loc = params.loc

    if (!['us', 'us-1', 'eu-1'].includes(loc as string)) {
      return HttpResponse.json({ code: 40010000, message: 'Invalid location' }, { status: 400 })
    }

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const quotes: Record<string, typeof mockCryptoQuote> = {}
    for (const symbol of symbolList) {
      quotes[symbol] = mockCryptoQuote
    }

    return HttpResponse.json({ quotes })
  }),

  // Crypto Snapshots
  http.get(`${BASE_URL}/v1beta3/crypto/:loc/snapshots`, ({ request, params }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')
    const loc = params.loc

    if (!['us', 'us-1', 'eu-1'].includes(loc as string)) {
      return HttpResponse.json({ code: 40010000, message: 'Invalid location' }, { status: 400 })
    }

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const snapshots: Record<string, typeof mockCryptoSnapshot> = {}
    for (const symbol of symbolList) {
      snapshots[symbol] = mockCryptoSnapshot
    }

    return HttpResponse.json({ snapshots })
  }),

  // Crypto Latest Orderbooks
  http.get(`${BASE_URL}/v1beta3/crypto/:loc/latest/orderbooks`, ({ request, params }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')
    const loc = params.loc

    if (!['us', 'us-1', 'eu-1'].includes(loc as string)) {
      return HttpResponse.json({ code: 40010000, message: 'Invalid location' }, { status: 400 })
    }

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const orderbooks: Record<string, typeof mockCryptoOrderbook> = {}
    for (const symbol of symbolList) {
      orderbooks[symbol] = mockCryptoOrderbook
    }

    return HttpResponse.json({ orderbooks })
  }),

  // Options Bars
  http.get(`${BASE_URL}/v1beta1/options/bars`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const bars: Record<string, (typeof mockOptionBar)[]> = {}
    for (const symbol of symbolList) {
      bars[symbol] = [mockOptionBar]
    }

    return HttpResponse.json({
      bars,
      next_page_token: null,
    })
  }),

  // Options Trades
  http.get(`${BASE_URL}/v1beta1/options/trades`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const trades: Record<string, (typeof mockOptionTrade)[]> = {}
    for (const symbol of symbolList) {
      trades[symbol] = [mockOptionTrade]
    }

    return HttpResponse.json({
      trades,
      next_page_token: null,
    })
  }),

  // Options Latest Trades
  http.get(`${BASE_URL}/v1beta1/options/trades/latest`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const trades: Record<string, typeof mockOptionTrade> = {}
    for (const symbol of symbolList) {
      trades[symbol] = mockOptionTrade
    }

    return HttpResponse.json({ trades })
  }),

  // Options Latest Quotes
  http.get(`${BASE_URL}/v1beta1/options/quotes/latest`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const quotes: Record<string, typeof mockOptionQuote> = {}
    for (const symbol of symbolList) {
      quotes[symbol] = mockOptionQuote
    }

    return HttpResponse.json({ quotes })
  }),

  // Options Snapshots
  http.get(`${BASE_URL}/v1beta1/options/snapshots`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    const symbolList = symbols.split(',')
    const snapshots: Record<string, typeof mockOptionSnapshot> = {}
    for (const symbol of symbolList) {
      snapshots[symbol] = mockOptionSnapshot
    }

    return HttpResponse.json({ snapshots })
  }),

  // Options Chain
  http.get(`${BASE_URL}/v1beta1/options/snapshots/:underlying_symbol`, ({ params }) => {
    const underlyingSymbol = params.underlying_symbol as string
    return HttpResponse.json({
      snapshots: {
        [`${underlyingSymbol}240119C00150000`]: { ...mockOptionSnapshot, greeks: mockOptionGreeks },
        [`${underlyingSymbol}240119P00150000`]: { ...mockOptionSnapshot, greeks: mockOptionGreeks },
      },
    })
  }),

  // Options Meta - Exchanges
  http.get(`${BASE_URL}/v1beta1/options/meta/exchanges`, () => {
    return HttpResponse.json(mockOptionsExchangeMapping)
  }),

  // Options Meta - Conditions
  http.get(`${BASE_URL}/v1beta1/options/meta/conditions/:ticktype`, () => {
    return HttpResponse.json(mockConditionMapping)
  }),

  // Screener - Movers
  http.get(`${BASE_URL}/v1beta1/screener/:market_type/movers`, ({ params }) => {
    const marketType = params.market_type as string

    if (!['stocks', 'crypto'].includes(marketType)) {
      return HttpResponse.json({ code: 40010000, message: 'Invalid market type' }, { status: 400 })
    }

    return HttpResponse.json({
      gainers: [mockMover],
      losers: [{ ...mockMover, change: -25.75, percent_change: -3.12 }],
      last_updated: '2024-01-15T16:00:00Z',
    })
  }),

  // Corporate Actions
  http.get(`${BASE_URL}/v1/corporate-actions`, ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.get('symbols')

    if (!symbols) {
      return HttpResponse.json({ code: 42210000, message: 'symbols is required' }, { status: 422 })
    }

    return HttpResponse.json({
      corporate_actions: {
        [symbols.split(',')[0]]: [mockCorporateAction],
      },
      next_page_token: null,
    })
  }),

  // Forex Latest Rates
  http.get(`${BASE_URL}/v1beta1/forex/latest/rates`, ({ request }) => {
    const url = new URL(request.url)
    const currencyPairs = url.searchParams.get('currency_pairs')

    if (!currencyPairs) {
      return HttpResponse.json(
        { code: 42210000, message: 'currency_pairs is required' },
        { status: 422 }
      )
    }

    const pairList = currencyPairs.split(',')
    const rates: Record<string, { bp: number; ap: number; mp: number; t: string }> = {}
    for (const pair of pairList) {
      rates[pair] = { bp: 1.085, ap: 1.0855, mp: 1.08525, t: '2024-01-15T14:30:00Z' }
    }

    return HttpResponse.json({ rates })
  }),

  // Forex Historical Rates
  http.get(`${BASE_URL}/v1beta1/forex/rates`, ({ request }) => {
    const url = new URL(request.url)
    const currencyPairs = url.searchParams.get('currency_pairs')

    if (!currencyPairs) {
      return HttpResponse.json(
        { code: 42210000, message: 'currency_pairs is required' },
        { status: 422 }
      )
    }

    const pairList = currencyPairs.split(',')
    const rates: Record<string, (typeof mockForexRate)[]> = {}
    for (const pair of pairList) {
      rates[pair] = [mockForexRate]
    }

    return HttpResponse.json({
      rates,
      next_page_token: null,
    })
  }),

  // Logos
  http.get(`${BASE_URL}/v1beta1/logos/:symbol`, ({ params }) => {
    const symbol = params.symbol as string
    // Return a mock PNG image data as ArrayBuffer
    const pngHeader = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    return new HttpResponse(pngHeader, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'X-Symbol': symbol,
      },
    })
  }),

  // Error handler for rate limiting test
  http.get(`${BASE_URL}/v2/stocks/error/ratelimit`, () => {
    return HttpResponse.json(
      { code: 42900000, message: 'Rate limit exceeded' },
      {
        status: 429,
        headers: { 'Retry-After': '60' },
      }
    )
  }),

  // Error handler for server error test
  http.get(`${BASE_URL}/v2/stocks/error/server`, () => {
    return HttpResponse.json({ code: 50000000, message: 'Internal server error' }, { status: 500 })
  }),

  // Error handler for not found test
  http.get(`${BASE_URL}/v2/stocks/error/notfound`, () => {
    return HttpResponse.json({ code: 40400000, message: 'Resource not found' }, { status: 404 })
  }),
]

const server = setupServer(...handlers)

// ============================================================================
// Test Suites
// ============================================================================

describe('Market Data Client', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  // --------------------------------------------------------------------------
  // Client Factory Tests
  // --------------------------------------------------------------------------

  describe('createMarketDataClient', () => {
    it('should create a client object with all required properties', () => {
      const client = createTestClient()

      expect(client).toBeDefined()
      expect(client.raw).toBeDefined()
      expect(client.stocks).toBeDefined()
      expect(client.crypto).toBeDefined()
      expect(client.options).toBeDefined()
      expect(client.news).toBeDefined()
      expect(client.screener).toBeDefined()
      expect(client.corporateActions).toBeDefined()
      expect(client.forex).toBeDefined()
      expect(client.logos).toBeDefined()
    })

    it('should create a client with stocks methods', () => {
      const client = createTestClient()

      expect(typeof client.stocks.getBars).toBe('function')
      expect(typeof client.stocks.getLatestBars).toBe('function')
      expect(typeof client.stocks.getTrades).toBe('function')
      expect(typeof client.stocks.getQuotes).toBe('function')
      expect(typeof client.stocks.getSnapshots).toBe('function')
      expect(typeof client.stocks.getSymbolBars).toBe('function')
      expect(typeof client.stocks.getLatestBar).toBe('function')
      expect(typeof client.stocks.getSymbolTrades).toBe('function')
      expect(typeof client.stocks.getLatestTrades).toBe('function')
      expect(typeof client.stocks.getLatestTrade).toBe('function')
      expect(typeof client.stocks.getSymbolQuotes).toBe('function')
      expect(typeof client.stocks.getLatestQuotes).toBe('function')
      expect(typeof client.stocks.getLatestQuote).toBe('function')
      expect(typeof client.stocks.getSnapshot).toBe('function')
      expect(typeof client.stocks.getAuctions).toBe('function')
      expect(typeof client.stocks.getSymbolAuctions).toBe('function')
      expect(typeof client.stocks.getExchanges).toBe('function')
      expect(typeof client.stocks.getConditions).toBe('function')
    })

    it('should create a client with crypto methods', () => {
      const client = createTestClient()

      expect(typeof client.crypto.getBars).toBe('function')
      expect(typeof client.crypto.getLatestBars).toBe('function')
      expect(typeof client.crypto.getTrades).toBe('function')
      expect(typeof client.crypto.getLatestTrades).toBe('function')
      expect(typeof client.crypto.getQuotes).toBe('function')
      expect(typeof client.crypto.getLatestQuotes).toBe('function')
      expect(typeof client.crypto.getSnapshots).toBe('function')
      expect(typeof client.crypto.getLatestOrderbooks).toBe('function')
    })

    it('should create a client with news methods', () => {
      const client = createTestClient()

      expect(typeof client.news.get).toBe('function')
    })

    it('should create a client with screener methods', () => {
      const client = createTestClient()

      expect(typeof client.screener.getMostActives).toBe('function')
      expect(typeof client.screener.getMovers).toBe('function')
    })
  })

  // --------------------------------------------------------------------------
  // Stock Data Tests
  // --------------------------------------------------------------------------

  describe('stocks.getBars', () => {
    it('should return stock bars for multiple symbols', async () => {
      const client = createTestClient()
      const symbol = 'AAPL'

      const result = await client.stocks.getBars({
        symbols: 'AAPL,MSFT',
        timeframe: '1Day',
      })

      expect(result).toBeDefined()
      expect(result.bars).toBeDefined()
      expect(result.bars).toHaveProperty('AAPL')
      expect(result.bars).toHaveProperty('MSFT')
      expect(result.bars![symbol]).toHaveLength(1)
      expect(result.bars![symbol]![0]).toMatchObject({
        o: 150.25,
        h: 151.5,
        l: 149.75,
        c: 151.0,
        v: 1250000,
      })
    })

    it('should return stock bars for a single symbol', async () => {
      const client = createTestClient()
      const symbol = 'GOOGL'

      const result = await client.stocks.getBars({
        symbols: 'GOOGL',
        timeframe: '1Hour',
      })

      expect(result.bars).toHaveProperty('GOOGL')
      expect(result.bars![symbol]![0].t).toBe('2024-01-15T14:30:00Z')
    })
  })

  describe('stocks.getLatestBars', () => {
    it('should return latest bars for multiple symbols', async () => {
      const client = createTestClient()
      const symbol = 'AAPL'

      const result = await client.stocks.getLatestBars({
        symbols: 'AAPL,TSLA,NVDA',
      })

      expect(result).toBeDefined()
      expect(result.bars).toBeDefined()
      expect(result.bars).toHaveProperty('AAPL')
      expect(result.bars).toHaveProperty('TSLA')
      expect(result.bars).toHaveProperty('NVDA')
      expect(result.bars![symbol].o).toBe(150.25)
    })
  })

  describe('stocks.getTrades', () => {
    it('should return trades for multiple symbols', async () => {
      const client = createTestClient()
      const symbol = 'AAPL'

      const result = await client.stocks.getTrades({
        symbols: 'AAPL,AMZN',
      })

      expect(result).toBeDefined()
      expect(result.trades).toBeDefined()
      expect(result.trades).toHaveProperty('AAPL')
      expect(result.trades).toHaveProperty('AMZN')
      expect(result.trades![symbol]).toHaveLength(1)
      expect(result.trades![symbol]![0]).toMatchObject({
        p: 150.5,
        s: 100,
        x: 'V',
      })
    })
  })

  describe('stocks.getQuotes', () => {
    it('should return quotes for multiple symbols', async () => {
      const client = createTestClient()
      const symbol = 'AAPL'

      const result = await client.stocks.getQuotes({
        symbols: 'AAPL,META',
      })

      expect(result).toBeDefined()
      expect(result.quotes).toBeDefined()
      expect(result.quotes).toHaveProperty('AAPL')
      expect(result.quotes).toHaveProperty('META')
      expect(result.quotes![symbol]).toHaveLength(1)
      expect(result.quotes![symbol]![0]).toMatchObject({
        ap: 150.55,
        bp: 150.45,
        as: 200,
        bs: 300,
      })
    })
  })

  describe('stocks.getSnapshots', () => {
    it('should return snapshots for multiple symbols', async () => {
      const client = createTestClient()
      const symbol = 'AAPL'

      const result = await client.stocks.getSnapshots({
        symbols: 'AAPL,GOOG',
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('AAPL')
      expect(result).toHaveProperty('GOOG')
      expect(result[symbol]).toHaveProperty('latestTrade')
      expect(result[symbol]).toHaveProperty('latestQuote')
      expect(result[symbol]).toHaveProperty('minuteBar')
      expect(result[symbol]).toHaveProperty('dailyBar')
      expect(result[symbol]).toHaveProperty('prevDailyBar')
    })

    it('should return snapshot with correct trade data', async () => {
      const client = createTestClient()
      const symbol = 'MSFT'

      const result = await client.stocks.getSnapshots({
        symbols: 'MSFT',
      })

      const snapshot = result[symbol]
      expect(snapshot.latestTrade).toMatchObject({
        p: 150.5,
        s: 100,
      })
    })
  })

  // --------------------------------------------------------------------------
  // Stock Single Symbol Tests
  // --------------------------------------------------------------------------

  describe('stocks.getSymbolBars', () => {
    it('should return bars for a single symbol', async () => {
      const client = createTestClient()

      const result = await client.stocks.getSymbolBars('AAPL', {
        timeframe: '1Day',
      })

      expect(result).toBeDefined()
      expect(result.bars).toBeDefined()
      expect(result.symbol).toBe('AAPL')
      expect(result.bars).toHaveLength(1)
      expect(result.bars![0]).toMatchObject({
        o: 150.25,
        h: 151.5,
        l: 149.75,
        c: 151.0,
      })
    })
  })

  describe('stocks.getLatestBar', () => {
    it('should return latest bar for a single symbol', async () => {
      const client = createTestClient()

      const result = await client.stocks.getLatestBar('TSLA')

      expect(result).toBeDefined()
      expect(result.bar).toBeDefined()
      expect(result.symbol).toBe('TSLA')
      expect(result.bar).toMatchObject({
        o: 150.25,
        h: 151.5,
        l: 149.75,
        c: 151.0,
      })
    })

    it('should accept optional feed parameter', async () => {
      const client = createTestClient()

      const result = await client.stocks.getLatestBar('AAPL', { feed: 'iex' })

      expect(result).toBeDefined()
      expect(result.bar).toBeDefined()
    })
  })

  describe('stocks.getSymbolTrades', () => {
    it('should return trades for a single symbol', async () => {
      const client = createTestClient()

      const result = await client.stocks.getSymbolTrades('GOOGL')

      expect(result).toBeDefined()
      expect(result.trades).toBeDefined()
      expect(result.symbol).toBe('GOOGL')
      expect(result.trades).toHaveLength(1)
      expect(result.trades![0]).toMatchObject({
        p: 150.5,
        s: 100,
        x: 'V',
      })
    })
  })

  describe('stocks.getLatestTrades', () => {
    it('should return latest trades for multiple symbols', async () => {
      const client = createTestClient()

      const result = await client.stocks.getLatestTrades({
        symbols: 'AAPL,MSFT,GOOGL',
      })

      expect(result).toBeDefined()
      expect(result.trades).toBeDefined()
      expect(result.trades).toHaveProperty('AAPL')
      expect(result.trades).toHaveProperty('MSFT')
      expect(result.trades).toHaveProperty('GOOGL')
      expect(result.trades!.AAPL).toMatchObject({
        p: 150.5,
        s: 100,
      })
    })
  })

  describe('stocks.getLatestTrade', () => {
    it('should return latest trade for a single symbol', async () => {
      const client = createTestClient()

      const result = await client.stocks.getLatestTrade('NVDA')

      expect(result).toBeDefined()
      expect(result.trade).toBeDefined()
      expect(result.symbol).toBe('NVDA')
      expect(result.trade).toMatchObject({
        p: 150.5,
        s: 100,
        x: 'V',
      })
    })

    it('should accept optional feed parameter', async () => {
      const client = createTestClient()

      const result = await client.stocks.getLatestTrade('META', { feed: 'sip' })

      expect(result).toBeDefined()
      expect(result.trade).toBeDefined()
    })
  })

  describe('stocks.getSymbolQuotes', () => {
    it('should return quotes for a single symbol', async () => {
      const client = createTestClient()

      const result = await client.stocks.getSymbolQuotes('AMD')

      expect(result).toBeDefined()
      expect(result.quotes).toBeDefined()
      expect(result.symbol).toBe('AMD')
      expect(result.quotes).toHaveLength(1)
      expect(result.quotes![0]).toMatchObject({
        ap: 150.55,
        bp: 150.45,
        as: 200,
        bs: 300,
      })
    })
  })

  describe('stocks.getLatestQuotes', () => {
    it('should return latest quotes for multiple symbols', async () => {
      const client = createTestClient()

      const result = await client.stocks.getLatestQuotes({
        symbols: 'AAPL,TSLA',
      })

      expect(result).toBeDefined()
      expect(result.quotes).toBeDefined()
      expect(result.quotes).toHaveProperty('AAPL')
      expect(result.quotes).toHaveProperty('TSLA')
      expect(result.quotes!.AAPL).toMatchObject({
        ap: 150.55,
        bp: 150.45,
      })
    })
  })

  describe('stocks.getLatestQuote', () => {
    it('should return latest quote for a single symbol', async () => {
      const client = createTestClient()

      const result = await client.stocks.getLatestQuote('INTC')

      expect(result).toBeDefined()
      expect(result.quote).toBeDefined()
      expect(result.symbol).toBe('INTC')
      expect(result.quote).toMatchObject({
        ap: 150.55,
        bp: 150.45,
        as: 200,
        bs: 300,
      })
    })

    it('should accept optional feed parameter', async () => {
      const client = createTestClient()

      const result = await client.stocks.getLatestQuote('AAPL', { feed: 'iex' })

      expect(result).toBeDefined()
      expect(result.quote).toBeDefined()
    })
  })

  describe('stocks.getSnapshot', () => {
    it('should return snapshot for a single symbol', async () => {
      const client = createTestClient()

      const result = await client.stocks.getSnapshot('AAPL')

      expect(result).toBeDefined()
      expect(result).toHaveProperty('latestTrade')
      expect(result).toHaveProperty('latestQuote')
      expect(result).toHaveProperty('minuteBar')
      expect(result).toHaveProperty('dailyBar')
      expect(result).toHaveProperty('prevDailyBar')
      expect(result.latestTrade).toMatchObject({
        p: 150.5,
        s: 100,
      })
    })

    it('should accept optional feed parameter', async () => {
      const client = createTestClient()

      const result = await client.stocks.getSnapshot('MSFT', { feed: 'sip' })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('latestTrade')
    })
  })

  describe('stocks.getAuctions', () => {
    it('should return auctions for multiple symbols', async () => {
      const client = createTestClient()

      const result = await client.stocks.getAuctions({
        symbols: 'AAPL,MSFT',
      })

      expect(result).toBeDefined()
      expect(result.auctions).toBeDefined()
      expect(result.auctions).toHaveProperty('AAPL')
      expect(result.auctions).toHaveProperty('MSFT')
      expect(result.auctions!.AAPL).toHaveLength(1)
      expect(result.auctions!.AAPL![0]).toHaveProperty('d')
      expect(result.auctions!.AAPL![0]).toHaveProperty('o')
      expect(result.auctions!.AAPL![0]).toHaveProperty('c')
    })
  })

  describe('stocks.getSymbolAuctions', () => {
    it('should return auctions for a single symbol', async () => {
      const client = createTestClient()

      const result = await client.stocks.getSymbolAuctions('GOOGL')

      expect(result).toBeDefined()
      expect(result.auctions).toBeDefined()
      expect(result.symbol).toBe('GOOGL')
      expect(result.auctions).toHaveLength(1)
      expect(result.auctions![0]).toMatchObject({
        d: '2024-01-15',
      })
    })
  })

  describe('stocks.getExchanges', () => {
    it('should return exchange code mappings', async () => {
      const client = createTestClient()

      const result = await client.stocks.getExchanges()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('A')
      expect(result).toHaveProperty('V')
      expect(result.V).toBe('IEX')
    })
  })

  describe('stocks.getConditions', () => {
    it('should return condition mappings for trade tick type', async () => {
      const client = createTestClient()

      const result = await client.stocks.getConditions('trade', { tape: 'A' })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('@')
      expect(result['@']).toBe('Regular Sale')
    })

    it('should return condition mappings for quote tick type', async () => {
      const client = createTestClient()

      const result = await client.stocks.getConditions('quote', { tape: 'A' })

      expect(result).toBeDefined()
    })
  })

  // --------------------------------------------------------------------------
  // Crypto Data Tests
  // --------------------------------------------------------------------------

  describe('crypto.getBars', () => {
    it('should return crypto bars for US location', async () => {
      const client = createTestClient()

      const result = await client.crypto.getBars('us', {
        symbols: 'BTC/USD,ETH/USD',
      })

      expect(result).toBeDefined()
      expect(result.bars).toBeDefined()
      expect(result.bars).toHaveProperty('BTC/USD')
      expect(result.bars).toHaveProperty('ETH/USD')
      expect(result.bars!['BTC/USD']).toHaveLength(1)
      expect(result.bars!['BTC/USD']![0]).toMatchObject({
        o: 42500.0,
        h: 42750.0,
        l: 42250.0,
        c: 42600.0,
      })
    })

    it('should return crypto bars for EU location', async () => {
      const client = createTestClient()

      const result = await client.crypto.getBars('eu-1', {
        symbols: 'BTC/EUR',
      })

      expect(result).toBeDefined()
      expect(result.bars).toHaveProperty('BTC/EUR')
    })
  })

  describe('crypto.getTrades', () => {
    it('should return crypto trades', async () => {
      const client = createTestClient()

      const result = await client.crypto.getTrades('us', {
        symbols: 'BTC/USD',
      })

      expect(result).toBeDefined()
      expect(result.trades).toBeDefined()
      expect(result.trades).toHaveProperty('BTC/USD')
      expect(result.trades!['BTC/USD']).toHaveLength(1)
      expect(result.trades!['BTC/USD']![0]).toMatchObject({
        p: 42550.0,
        s: 0.5,
        tks: 'B',
      })
    })
  })

  describe('crypto.getLatestBars', () => {
    it('should return latest crypto bars for US location', async () => {
      const client = createTestClient()

      const result = await client.crypto.getLatestBars('us', {
        symbols: 'BTC/USD,ETH/USD',
      })

      expect(result).toBeDefined()
      expect(result.bars).toBeDefined()
      expect(result.bars).toHaveProperty('BTC/USD')
      expect(result.bars).toHaveProperty('ETH/USD')
      expect(result.bars!['BTC/USD']).toMatchObject({
        o: 42500.0,
        h: 42750.0,
        l: 42250.0,
        c: 42600.0,
      })
    })

    it('should return latest crypto bars for EU location', async () => {
      const client = createTestClient()

      const result = await client.crypto.getLatestBars('eu-1', {
        symbols: 'BTC/EUR',
      })

      expect(result).toBeDefined()
      expect(result.bars).toHaveProperty('BTC/EUR')
    })
  })

  describe('crypto.getLatestTrades', () => {
    it('should return latest crypto trades', async () => {
      const client = createTestClient()

      const result = await client.crypto.getLatestTrades('us', {
        symbols: 'BTC/USD,ETH/USD',
      })

      expect(result).toBeDefined()
      expect(result.trades).toBeDefined()
      expect(result.trades).toHaveProperty('BTC/USD')
      expect(result.trades).toHaveProperty('ETH/USD')
      expect(result.trades!['BTC/USD']).toMatchObject({
        p: 42550.0,
        s: 0.5,
        tks: 'B',
      })
    })
  })

  describe('crypto.getQuotes', () => {
    it('should return crypto quotes', async () => {
      const client = createTestClient()

      const result = await client.crypto.getQuotes('us', {
        symbols: 'BTC/USD',
      })

      expect(result).toBeDefined()
      expect(result.quotes).toBeDefined()
      expect(result.quotes).toHaveProperty('BTC/USD')
      expect(result.quotes!['BTC/USD']).toHaveLength(1)
      expect(result.quotes!['BTC/USD']![0]).toMatchObject({
        bp: 42500.0,
        ap: 42510.0,
      })
    })
  })

  describe('crypto.getLatestQuotes', () => {
    it('should return latest crypto quotes', async () => {
      const client = createTestClient()

      const result = await client.crypto.getLatestQuotes('us', {
        symbols: 'BTC/USD,ETH/USD',
      })

      expect(result).toBeDefined()
      expect(result.quotes).toBeDefined()
      expect(result.quotes).toHaveProperty('BTC/USD')
      expect(result.quotes).toHaveProperty('ETH/USD')
      expect(result.quotes!['BTC/USD']).toMatchObject({
        bp: 42500.0,
        bs: 1.5,
        ap: 42510.0,
        as: 2.0,
      })
    })
  })

  describe('crypto.getSnapshots', () => {
    it('should return crypto snapshots', async () => {
      const client = createTestClient()

      const result = await client.crypto.getSnapshots('us', {
        symbols: 'BTC/USD,ETH/USD',
      })

      expect(result).toBeDefined()
      expect(result.snapshots).toBeDefined()
      expect(result.snapshots).toHaveProperty('BTC/USD')
      expect(result.snapshots).toHaveProperty('ETH/USD')
      expect(result.snapshots!['BTC/USD']).toHaveProperty('latestTrade')
      expect(result.snapshots!['BTC/USD']).toHaveProperty('latestQuote')
      expect(result.snapshots!['BTC/USD']).toHaveProperty('minuteBar')
    })

    it('should return crypto snapshots for EU location', async () => {
      const client = createTestClient()

      const result = await client.crypto.getSnapshots('eu-1', {
        symbols: 'BTC/EUR',
      })

      expect(result).toBeDefined()
      expect(result.snapshots).toHaveProperty('BTC/EUR')
    })
  })

  describe('crypto.getLatestOrderbooks', () => {
    it('should return crypto orderbooks', async () => {
      const client = createTestClient()

      const result = await client.crypto.getLatestOrderbooks('us', {
        symbols: 'BTC/USD,ETH/USD',
      })

      expect(result).toBeDefined()
      expect(result.orderbooks).toBeDefined()
      expect(result.orderbooks).toHaveProperty('BTC/USD')
      expect(result.orderbooks).toHaveProperty('ETH/USD')
      expect(result.orderbooks!['BTC/USD']).toHaveProperty('b')
      expect(result.orderbooks!['BTC/USD']).toHaveProperty('a')
      expect(result.orderbooks!['BTC/USD'].b).toHaveLength(2)
      expect(result.orderbooks!['BTC/USD'].a).toHaveLength(2)
      expect(result.orderbooks!['BTC/USD'].b![0]).toMatchObject({
        p: 42500.0,
        s: 1.5,
      })
    })

    it('should return orderbooks with timestamp', async () => {
      const client = createTestClient()

      const result = await client.crypto.getLatestOrderbooks('us', {
        symbols: 'BTC/USD',
      })

      expect(result.orderbooks!['BTC/USD'].t).toBe('2024-01-15T14:30:00Z')
    })
  })

  // --------------------------------------------------------------------------
  // Options Data Tests
  // --------------------------------------------------------------------------

  describe('options.getBars', () => {
    it('should return option bars for multiple symbols', async () => {
      const client = createTestClient()

      const result = await client.options.getBars({
        symbols: 'AAPL240119C00150000,AAPL240119P00150000',
      })

      expect(result).toBeDefined()
      expect(result.bars).toBeDefined()
      expect(result.bars).toHaveProperty('AAPL240119C00150000')
      expect(result.bars).toHaveProperty('AAPL240119P00150000')
      expect(result.bars!.AAPL240119C00150000).toHaveLength(1)
      expect(result.bars!.AAPL240119C00150000![0]).toMatchObject({
        o: 5.25,
        h: 5.75,
        l: 5.0,
        c: 5.5,
      })
    })
  })

  describe('options.getTrades', () => {
    it('should return option trades', async () => {
      const client = createTestClient()

      const result = await client.options.getTrades({
        symbols: 'AAPL240119C00150000',
      })

      expect(result).toBeDefined()
      expect(result.trades).toBeDefined()
      expect(result.trades).toHaveProperty('AAPL240119C00150000')
      expect(result.trades!.AAPL240119C00150000).toHaveLength(1)
      expect(result.trades!.AAPL240119C00150000![0]).toMatchObject({
        p: 5.5,
        s: 10,
        x: 'C',
      })
    })
  })

  describe('options.getLatestTrades', () => {
    it('should return latest option trades', async () => {
      const client = createTestClient()

      const result = await client.options.getLatestTrades({
        symbols: 'AAPL240119C00150000,AAPL240119P00150000',
      })

      expect(result).toBeDefined()
      expect(result.trades).toBeDefined()
      expect(result.trades).toHaveProperty('AAPL240119C00150000')
      expect(result.trades).toHaveProperty('AAPL240119P00150000')
      expect(result.trades!.AAPL240119C00150000).toMatchObject({
        p: 5.5,
        s: 10,
      })
    })
  })

  describe('options.getLatestQuotes', () => {
    it('should return latest option quotes', async () => {
      const client = createTestClient()

      const result = await client.options.getLatestQuotes({
        symbols: 'AAPL240119C00150000,AAPL240119P00150000',
      })

      expect(result).toBeDefined()
      expect(result.quotes).toBeDefined()
      expect(result.quotes).toHaveProperty('AAPL240119C00150000')
      expect(result.quotes).toHaveProperty('AAPL240119P00150000')
      expect(result.quotes!.AAPL240119C00150000).toMatchObject({
        ap: 5.6,
        as: 20,
        bp: 5.4,
        bs: 15,
      })
    })
  })

  describe('options.getSnapshots', () => {
    it('should return option snapshots', async () => {
      const client = createTestClient()

      const result = await client.options.getSnapshots({
        symbols: 'AAPL240119C00150000,AAPL240119P00150000',
      })

      expect(result).toBeDefined()
      expect(result.snapshots).toBeDefined()
      expect(result.snapshots).toHaveProperty('AAPL240119C00150000')
      expect(result.snapshots).toHaveProperty('AAPL240119P00150000')
      expect(result.snapshots!.AAPL240119C00150000).toHaveProperty('latestTrade')
      expect(result.snapshots!.AAPL240119C00150000).toHaveProperty('latestQuote')
    })
  })

  describe('options.getChain', () => {
    it('should return option chain for underlying symbol', async () => {
      const client = createTestClient()

      const result = await client.options.getChain('AAPL')

      expect(result).toBeDefined()
      expect(result.snapshots).toBeDefined()
      expect(result.snapshots).toHaveProperty('AAPL240119C00150000')
      expect(result.snapshots).toHaveProperty('AAPL240119P00150000')
      expect(result.snapshots!.AAPL240119C00150000).toHaveProperty('greeks')
      expect(result.snapshots!.AAPL240119C00150000.greeks).toMatchObject({
        delta: 0.45,
        gamma: 0.02,
        theta: -0.05,
      })
    })

    it('should accept optional parameters', async () => {
      const client = createTestClient()

      const result = await client.options.getChain('MSFT', {
        type: 'call',
        expiration_date: '2024-01-19',
      })

      expect(result).toBeDefined()
      expect(result.snapshots).toBeDefined()
    })
  })

  describe('options.getExchanges', () => {
    it('should return option exchange code mappings', async () => {
      const client = createTestClient()

      const result = await client.options.getExchanges()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('A')
      expect(result).toHaveProperty('C')
      expect(result.C).toBe('CBOE')
    })
  })

  describe('options.getConditions', () => {
    it('should return condition mappings for trade tick type', async () => {
      const client = createTestClient()

      const result = await client.options.getConditions('trade')

      expect(result).toBeDefined()
      expect(result).toHaveProperty('@')
      expect(result['@']).toBe('Regular Sale')
    })

    it('should return condition mappings for quote tick type', async () => {
      const client = createTestClient()

      const result = await client.options.getConditions('quote')

      expect(result).toBeDefined()
    })
  })

  // --------------------------------------------------------------------------
  // News Tests
  // --------------------------------------------------------------------------

  describe('news.get', () => {
    it('should return news articles', async () => {
      const client = createTestClient()

      const result = await client.news.get()

      expect(result).toBeDefined()
      expect(result.news).toBeDefined()
      expect(result.news).toHaveLength(1)
      expect(result.news![0]).toMatchObject({
        id: 12345678,
        headline: 'Stock Market Reaches New Highs',
        author: 'Financial Reporter',
        source: 'benzinga',
      })
    })

    it('should return news with symbols array', async () => {
      const client = createTestClient()

      const result = await client.news.get()

      expect(result.news![0].symbols).toEqual(['AAPL', 'MSFT', 'GOOGL'])
    })

    it('should return news with images', async () => {
      const client = createTestClient()

      const result = await client.news.get()

      expect(result.news![0].images).toHaveLength(1)
      expect(result.news![0].images![0]).toMatchObject({
        size: 'large',
        url: 'https://example.com/image.jpg',
      })
    })

    it('should accept query parameters', async () => {
      const client = createTestClient()

      const result = await client.news.get({
        symbols: 'AAPL,MSFT',
        limit: 10,
      })

      expect(result).toBeDefined()
      expect(result.news).toBeDefined()
    })
  })

  // --------------------------------------------------------------------------
  // Screener Tests
  // --------------------------------------------------------------------------

  describe('screener.getMostActives', () => {
    it('should return most active stocks', async () => {
      const client = createTestClient()

      const result = await client.screener.getMostActives()

      expect(result).toBeDefined()
      expect(result.most_actives).toBeDefined()
      expect(result.most_actives).toHaveLength(1)
      expect(result.most_actives![0]).toMatchObject({
        symbol: 'AAPL',
        volume: 85000000,
        trade_count: 450000,
      })
    })

    it('should return last_updated timestamp', async () => {
      const client = createTestClient()

      const result = await client.screener.getMostActives()

      expect(result.last_updated).toBe('2024-01-15T16:00:00Z')
    })

    it('should accept optional parameters', async () => {
      const client = createTestClient()

      const result = await client.screener.getMostActives({
        by: 'volume',
        top: 10,
      })

      expect(result).toBeDefined()
      expect(result.most_actives).toBeDefined()
    })
  })

  describe('screener.getMovers', () => {
    it('should return stock movers', async () => {
      const client = createTestClient()

      const result = await client.screener.getMovers('stocks')

      expect(result).toBeDefined()
      expect(result.gainers).toBeDefined()
      expect(result.losers).toBeDefined()
      expect(result.gainers).toHaveLength(1)
      expect(result.losers).toHaveLength(1)
      expect(result.gainers![0]).toMatchObject({
        symbol: 'NVDA',
        price: 850.5,
        change: 25.75,
        percent_change: 3.12,
      })
    })

    it('should return crypto movers', async () => {
      const client = createTestClient()

      const result = await client.screener.getMovers('crypto')

      expect(result).toBeDefined()
      expect(result.gainers).toBeDefined()
      expect(result.losers).toBeDefined()
    })

    it('should include losers with negative changes', async () => {
      const client = createTestClient()

      const result = await client.screener.getMovers('stocks')

      expect(result.losers![0]).toMatchObject({
        change: -25.75,
        percent_change: -3.12,
      })
    })

    it('should return last_updated timestamp', async () => {
      const client = createTestClient()

      const result = await client.screener.getMovers('stocks')

      expect(result.last_updated).toBe('2024-01-15T16:00:00Z')
    })

    it('should accept optional parameters', async () => {
      const client = createTestClient()

      const result = await client.screener.getMovers('stocks', {
        top: 10,
      })

      expect(result).toBeDefined()
      expect(result.gainers).toBeDefined()
    })
  })

  // --------------------------------------------------------------------------
  // Corporate Actions Tests
  // --------------------------------------------------------------------------

  describe('corporateActions.get', () => {
    it('should return corporate actions for a symbol', async () => {
      const client = createTestClient()

      const result = await client.corporateActions.get({
        symbols: 'AAPL',
      })

      expect(result).toBeDefined()
      expect(result.corporate_actions).toBeDefined()
      expect(result.corporate_actions).toHaveProperty('AAPL')
      expect(result.corporate_actions!.AAPL).toHaveLength(1)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.corporate_actions!.AAPL![0]).toMatchObject({
        id: 'ca-123456',
        corporate_actions_type: 'dividend',
        symbol: 'AAPL',
      })
    })

    it('should include date fields in corporate action', async () => {
      const client = createTestClient()

      const result = await client.corporateActions.get({
        symbols: 'AAPL',
      })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const action = result.corporate_actions!.AAPL![0]
      expect(action).toHaveProperty('declaration_date')
      expect(action).toHaveProperty('ex_date')
      expect(action).toHaveProperty('record_date')
      expect(action).toHaveProperty('payable_date')
    })
  })

  // --------------------------------------------------------------------------
  // Forex Tests
  // --------------------------------------------------------------------------

  describe('forex.getLatestRates', () => {
    it('should return latest forex rates', async () => {
      const client = createTestClient()

      const result = await client.forex.getLatestRates({
        currency_pairs: 'EUR/USD,GBP/USD',
      })

      expect(result).toBeDefined()
      expect(result.rates).toBeDefined()
      expect(result.rates).toHaveProperty('EUR/USD')
      expect(result.rates).toHaveProperty('GBP/USD')
      expect(result.rates!['EUR/USD']).toMatchObject({
        bp: 1.085,
        ap: 1.0855,
        mp: 1.08525,
      })
    })

    it('should include timestamp in rates', async () => {
      const client = createTestClient()

      const result = await client.forex.getLatestRates({
        currency_pairs: 'EUR/USD',
      })

      expect(result.rates!['EUR/USD'].t).toBe('2024-01-15T14:30:00Z')
    })
  })

  describe('forex.getRates', () => {
    it('should return historical forex rates', async () => {
      const client = createTestClient()

      const result = await client.forex.getRates({
        currency_pairs: 'EUR/USD,GBP/USD',
      })

      expect(result).toBeDefined()
      expect(result.rates).toBeDefined()
      expect(result.rates).toHaveProperty('EUR/USD')
      expect(result.rates).toHaveProperty('GBP/USD')
      expect(result.rates!['EUR/USD']).toHaveLength(1)
      expect(result.rates!['EUR/USD']![0]).toMatchObject({
        o: 1.085,
        h: 1.0875,
        l: 1.0825,
        c: 1.086,
      })
    })

    it('should return rates with next_page_token', async () => {
      const client = createTestClient()

      const result = await client.forex.getRates({
        currency_pairs: 'EUR/USD',
      })

      expect(result).toHaveProperty('next_page_token')
    })
  })

  // --------------------------------------------------------------------------
  // Logos Tests
  // --------------------------------------------------------------------------

  describe('logos.get', () => {
    it('should call the logos endpoint for a symbol', async () => {
      let capturedRequest: Request | undefined

      server.use(
        http.get(`${BASE_URL}/v1beta1/logos/:symbol`, ({ request, params }) => {
          capturedRequest = request
          const symbol = params.symbol as string
          // Return a valid JSON response that openapi-fetch can parse
          return HttpResponse.json({ symbol, url: `https://logos.example.com/${symbol}.png` })
        })
      )

      const client = createTestClient()
      const result = await client.logos.get('AAPL')

      expect(result).toBeDefined()
      expect(capturedRequest).toBeDefined()
      expect(capturedRequest!.url).toContain('/v1beta1/logos/AAPL')
    })

    it('should accept optional placeholder parameter', async () => {
      let capturedUrl: string | undefined

      server.use(
        http.get(`${BASE_URL}/v1beta1/logos/:symbol`, ({ request, params }) => {
          capturedUrl = request.url
          const symbol = params.symbol as string
          return HttpResponse.json({ symbol, url: `https://logos.example.com/${symbol}.png` })
        })
      )

      const client = createTestClient()
      await client.logos.get('MSFT', { placeholder: true })

      expect(capturedUrl).toBeDefined()
      expect(capturedUrl).toContain('placeholder=true')
    })
  })

  // --------------------------------------------------------------------------
  // Error Handling Tests
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw error when symbols parameter is missing for getBars', async () => {
      const client = createTestClient()

      // The API should throw when required params are missing
      // We need to test with a valid call that gets a 422 response
      server.use(
        http.get(`${BASE_URL}/v2/stocks/bars`, () => {
          return HttpResponse.json(
            { code: 42210000, message: 'symbols is required' },
            { status: 422 }
          )
        })
      )

      await expect(client.stocks.getBars({ symbols: '', timeframe: '1Day' })).rejects.toMatchObject(
        {
          message: 'symbols is required',
        }
      )
    })

    it('should throw error on 401 unauthorized response', async () => {
      const clientWithBadCredentials = createMarketDataClient({
        keyId: 'bad-key',
        secretKey: 'bad-secret',
        baseUrl: BASE_URL,
      })

      await expect(
        clientWithBadCredentials.stocks.getBars({ symbols: 'AAPL', timeframe: '1Day' })
      ).rejects.toMatchObject({
        message: 'Unauthorized',
      })
    })

    it('should throw error on 404 not found response', async () => {
      const client = createTestClient()

      server.use(
        http.get(`${BASE_URL}/v2/stocks/bars`, () => {
          return HttpResponse.json({ code: 40400000, message: 'Symbol not found' }, { status: 404 })
        })
      )

      await expect(
        client.stocks.getBars({ symbols: 'INVALID123', timeframe: '1Day' })
      ).rejects.toMatchObject({
        message: 'Symbol not found',
      })
    })

    it('should throw error on 500 server error response', async () => {
      const client = createTestClient()

      server.use(
        http.get(`${BASE_URL}/v2/stocks/bars`, () => {
          return HttpResponse.json(
            { code: 50000000, message: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      // Server errors trigger retries, so we expect this to eventually throw
      await expect(
        client.stocks.getBars({ symbols: 'AAPL', timeframe: '1Day' })
      ).rejects.toMatchObject({
        message: 'Internal server error',
      })
    })

    it('should include error code in thrown error', async () => {
      const client = createTestClient()

      server.use(
        http.get(`${BASE_URL}/v2/stocks/bars`, () => {
          return HttpResponse.json({ code: 42210000, message: 'Validation error' }, { status: 422 })
        })
      )

      try {
        await client.stocks.getBars({ symbols: 'AAPL', timeframe: '1Day' })
        expect.fail('Expected error to be thrown')
      } catch (error: unknown) {
        expect(error).toHaveProperty('code', 42210000)
        expect(error).toHaveProperty('message', 'Validation error')
      }
    })
  })

  // --------------------------------------------------------------------------
  // Authentication Tests
  // --------------------------------------------------------------------------

  describe('authentication', () => {
    it('should include API key headers in requests', async () => {
      let capturedHeaders: Headers | undefined

      server.use(
        http.get(`${BASE_URL}/v2/stocks/bars`, ({ request }) => {
          capturedHeaders = request.headers

          const keyId = request.headers.get('APCA-API-KEY-ID')
          const secretKey = request.headers.get('APCA-API-SECRET-KEY')

          if (keyId !== TEST_KEY_ID || secretKey !== TEST_SECRET_KEY) {
            return HttpResponse.json({ code: 40110000, message: 'Unauthorized' }, { status: 401 })
          }

          return HttpResponse.json({
            bars: { AAPL: [mockStockBar] },
            next_page_token: null,
          })
        })
      )

      const client = createTestClient()
      await client.stocks.getBars({ symbols: 'AAPL', timeframe: '1Day' })

      expect(capturedHeaders?.get('APCA-API-KEY-ID')).toBe(TEST_KEY_ID)
      expect(capturedHeaders?.get('APCA-API-SECRET-KEY')).toBe(TEST_SECRET_KEY)
    })
  })

  // --------------------------------------------------------------------------
  // Request Options Tests
  // --------------------------------------------------------------------------

  describe('request options', () => {
    it('should support AbortSignal for request cancellation', async () => {
      const client = createTestClient()
      const controller = new AbortController()

      // Abort immediately
      controller.abort()

      await expect(
        client.stocks.getBars({ symbols: 'AAPL', timeframe: '1Day' }, { signal: controller.signal })
      ).rejects.toThrow()
    })
  })

  // --------------------------------------------------------------------------
  // Branch Coverage Tests
  // --------------------------------------------------------------------------

  describe('branch coverage tests', () => {
    /**
     * These tests ensure all branches are covered:
     * 1. Methods with optional `options` parameter (signal branch)
     * 2. Methods with optional `params` parameter (with/without params)
     */

    // ========================================================================
    // Stock Methods - Signal Branch Coverage
    // ========================================================================

    describe('stocks - signal branch coverage', () => {
      it('stocks.getBars() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getBars(
          { symbols: 'AAPL', timeframe: '1Day' },
          { signal: controller.signal }
        )

        expect(result.bars).toHaveProperty('AAPL')
      })

      it('stocks.getSymbolBars() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getSymbolBars(
          'AAPL',
          { timeframe: '1Day' },
          { signal: controller.signal }
        )

        expect(result.symbol).toBe('AAPL')
      })

      it('stocks.getLatestBars() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getLatestBars(
          { symbols: 'AAPL' },
          { signal: controller.signal }
        )

        expect(result.bars).toHaveProperty('AAPL')
      })

      it('stocks.getLatestBar() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getLatestBar(
          'AAPL',
          { feed: 'iex' },
          { signal: controller.signal }
        )

        expect(result.symbol).toBe('AAPL')
      })

      it('stocks.getTrades() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getTrades(
          { symbols: 'AAPL' },
          { signal: controller.signal }
        )

        expect(result.trades).toHaveProperty('AAPL')
      })

      it('stocks.getSymbolTrades() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getSymbolTrades(
          'AAPL',
          { limit: 10 },
          { signal: controller.signal }
        )

        expect(result.symbol).toBe('AAPL')
      })

      it('stocks.getLatestTrades() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getLatestTrades(
          { symbols: 'AAPL' },
          { signal: controller.signal }
        )

        expect(result.trades).toHaveProperty('AAPL')
      })

      it('stocks.getLatestTrade() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getLatestTrade(
          'AAPL',
          { feed: 'sip' },
          { signal: controller.signal }
        )

        expect(result.symbol).toBe('AAPL')
      })

      it('stocks.getQuotes() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getQuotes(
          { symbols: 'AAPL' },
          { signal: controller.signal }
        )

        expect(result.quotes).toHaveProperty('AAPL')
      })

      it('stocks.getSymbolQuotes() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getSymbolQuotes(
          'AAPL',
          { limit: 10 },
          { signal: controller.signal }
        )

        expect(result.symbol).toBe('AAPL')
      })

      it('stocks.getLatestQuotes() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getLatestQuotes(
          { symbols: 'AAPL' },
          { signal: controller.signal }
        )

        expect(result.quotes).toHaveProperty('AAPL')
      })

      it('stocks.getLatestQuote() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getLatestQuote(
          'AAPL',
          { feed: 'iex' },
          { signal: controller.signal }
        )

        expect(result.symbol).toBe('AAPL')
      })

      it('stocks.getSnapshots() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getSnapshots(
          { symbols: 'AAPL' },
          { signal: controller.signal }
        )

        expect(result).toHaveProperty('AAPL')
      })

      it('stocks.getSnapshot() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getSnapshot(
          'AAPL',
          { feed: 'sip' },
          { signal: controller.signal }
        )

        expect(result).toHaveProperty('latestTrade')
      })

      it('stocks.getAuctions() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getAuctions(
          { symbols: 'AAPL' },
          { signal: controller.signal }
        )

        expect(result.auctions).toHaveProperty('AAPL')
      })

      it('stocks.getSymbolAuctions() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getSymbolAuctions(
          'AAPL',
          { limit: 10 },
          { signal: controller.signal }
        )

        expect(result.symbol).toBe('AAPL')
      })

      it('stocks.getExchanges() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getExchanges({ signal: controller.signal })

        expect(result).toHaveProperty('V')
      })

      it('stocks.getConditions() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.stocks.getConditions(
          'trade',
          { tape: 'A' },
          { signal: controller.signal }
        )

        expect(result).toHaveProperty('@')
      })
    })

    // ========================================================================
    // Stock Methods - Optional Params Branch Coverage
    // ========================================================================

    describe('stocks - optional params branch coverage', () => {
      it('stocks.getLatestBar() without optional params', async () => {
        const client = createTestClient()

        const result = await client.stocks.getLatestBar('AAPL')

        expect(result.symbol).toBe('AAPL')
        expect(result.bar).toBeDefined()
      })

      it('stocks.getSymbolTrades() without optional params', async () => {
        const client = createTestClient()

        const result = await client.stocks.getSymbolTrades('AAPL')

        expect(result.symbol).toBe('AAPL')
        expect(result.trades).toBeDefined()
      })

      it('stocks.getLatestTrade() without optional params', async () => {
        const client = createTestClient()

        const result = await client.stocks.getLatestTrade('AAPL')

        expect(result.symbol).toBe('AAPL')
        expect(result.trade).toBeDefined()
      })

      it('stocks.getSymbolQuotes() without optional params', async () => {
        const client = createTestClient()

        const result = await client.stocks.getSymbolQuotes('AAPL')

        expect(result.symbol).toBe('AAPL')
        expect(result.quotes).toBeDefined()
      })

      it('stocks.getLatestQuote() without optional params', async () => {
        const client = createTestClient()

        const result = await client.stocks.getLatestQuote('AAPL')

        expect(result.symbol).toBe('AAPL')
        expect(result.quote).toBeDefined()
      })

      it('stocks.getSnapshot() without optional params', async () => {
        const client = createTestClient()

        const result = await client.stocks.getSnapshot('AAPL')

        expect(result).toHaveProperty('latestTrade')
      })

      it('stocks.getSymbolAuctions() without optional params', async () => {
        const client = createTestClient()

        const result = await client.stocks.getSymbolAuctions('AAPL')

        expect(result.symbol).toBe('AAPL')
        expect(result.auctions).toBeDefined()
      })

      it('stocks.getExchanges() without options', async () => {
        const client = createTestClient()

        const result = await client.stocks.getExchanges()

        expect(result).toHaveProperty('V')
      })
    })

    // ========================================================================
    // Crypto Methods - Signal Branch Coverage
    // ========================================================================

    describe('crypto - signal branch coverage', () => {
      it('crypto.getBars() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.crypto.getBars(
          'us',
          { symbols: 'BTC/USD' },
          { signal: controller.signal }
        )

        expect(result.bars).toHaveProperty('BTC/USD')
      })

      it('crypto.getLatestBars() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.crypto.getLatestBars(
          'us',
          { symbols: 'BTC/USD' },
          { signal: controller.signal }
        )

        expect(result.bars).toHaveProperty('BTC/USD')
      })

      it('crypto.getTrades() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.crypto.getTrades(
          'us',
          { symbols: 'BTC/USD' },
          { signal: controller.signal }
        )

        expect(result.trades).toHaveProperty('BTC/USD')
      })

      it('crypto.getLatestTrades() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.crypto.getLatestTrades(
          'us',
          { symbols: 'BTC/USD' },
          { signal: controller.signal }
        )

        expect(result.trades).toHaveProperty('BTC/USD')
      })

      it('crypto.getQuotes() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.crypto.getQuotes(
          'us',
          { symbols: 'BTC/USD' },
          { signal: controller.signal }
        )

        expect(result.quotes).toHaveProperty('BTC/USD')
      })

      it('crypto.getLatestQuotes() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.crypto.getLatestQuotes(
          'us',
          { symbols: 'BTC/USD' },
          { signal: controller.signal }
        )

        expect(result.quotes).toHaveProperty('BTC/USD')
      })

      it('crypto.getSnapshots() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.crypto.getSnapshots(
          'us',
          { symbols: 'BTC/USD' },
          { signal: controller.signal }
        )

        expect(result.snapshots).toHaveProperty('BTC/USD')
      })

      it('crypto.getLatestOrderbooks() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.crypto.getLatestOrderbooks(
          'us',
          { symbols: 'BTC/USD' },
          { signal: controller.signal }
        )

        expect(result.orderbooks).toHaveProperty('BTC/USD')
      })
    })

    // ========================================================================
    // Options Methods - Signal Branch Coverage
    // ========================================================================

    describe('options - signal branch coverage', () => {
      it('options.getBars() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.options.getBars(
          { symbols: 'AAPL240119C00150000' },
          { signal: controller.signal }
        )

        expect(result.bars).toHaveProperty('AAPL240119C00150000')
      })

      it('options.getTrades() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.options.getTrades(
          { symbols: 'AAPL240119C00150000' },
          { signal: controller.signal }
        )

        expect(result.trades).toHaveProperty('AAPL240119C00150000')
      })

      it('options.getLatestTrades() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.options.getLatestTrades(
          { symbols: 'AAPL240119C00150000' },
          { signal: controller.signal }
        )

        expect(result.trades).toHaveProperty('AAPL240119C00150000')
      })

      it('options.getLatestQuotes() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.options.getLatestQuotes(
          { symbols: 'AAPL240119C00150000' },
          { signal: controller.signal }
        )

        expect(result.quotes).toHaveProperty('AAPL240119C00150000')
      })

      it('options.getSnapshots() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.options.getSnapshots(
          { symbols: 'AAPL240119C00150000' },
          { signal: controller.signal }
        )

        expect(result.snapshots).toHaveProperty('AAPL240119C00150000')
      })

      it('options.getChain() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.options.getChain(
          'AAPL',
          { type: 'call' },
          { signal: controller.signal }
        )

        expect(result.snapshots).toBeDefined()
      })

      it('options.getExchanges() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.options.getExchanges({ signal: controller.signal })

        expect(result).toHaveProperty('C')
      })

      it('options.getConditions() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.options.getConditions('trade', { signal: controller.signal })

        expect(result).toHaveProperty('@')
      })
    })

    // ========================================================================
    // Options Methods - Optional Params Branch Coverage
    // ========================================================================

    describe('options - optional params branch coverage', () => {
      it('options.getChain() without optional params', async () => {
        const client = createTestClient()

        const result = await client.options.getChain('AAPL')

        expect(result.snapshots).toBeDefined()
      })

      it('options.getExchanges() without options', async () => {
        const client = createTestClient()

        const result = await client.options.getExchanges()

        expect(result).toHaveProperty('C')
      })

      it('options.getConditions() without options', async () => {
        const client = createTestClient()

        const result = await client.options.getConditions('trade')

        expect(result).toHaveProperty('@')
      })
    })

    // ========================================================================
    // News Methods - Signal Branch Coverage
    // ========================================================================

    describe('news - signal branch coverage', () => {
      it('news.get() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.news.get({ symbols: 'AAPL' }, { signal: controller.signal })

        expect(result.news).toBeDefined()
      })
    })

    // ========================================================================
    // News Methods - Optional Params Branch Coverage
    // ========================================================================

    describe('news - optional params branch coverage', () => {
      it('news.get() without params', async () => {
        const client = createTestClient()

        const result = await client.news.get()

        expect(result.news).toBeDefined()
      })
    })

    // ========================================================================
    // Screener Methods - Signal Branch Coverage
    // ========================================================================

    describe('screener - signal branch coverage', () => {
      it('screener.getMostActives() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.screener.getMostActives(
          { by: 'volume' },
          { signal: controller.signal }
        )

        expect(result.most_actives).toBeDefined()
      })

      it('screener.getMovers() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.screener.getMovers(
          'stocks',
          { top: 10 },
          { signal: controller.signal }
        )

        expect(result.gainers).toBeDefined()
      })
    })

    // ========================================================================
    // Screener Methods - Optional Params Branch Coverage
    // ========================================================================

    describe('screener - optional params branch coverage', () => {
      it('screener.getMostActives() without params', async () => {
        const client = createTestClient()

        const result = await client.screener.getMostActives()

        expect(result.most_actives).toBeDefined()
      })

      it('screener.getMovers() without optional params', async () => {
        const client = createTestClient()

        const result = await client.screener.getMovers('stocks')

        expect(result.gainers).toBeDefined()
      })
    })

    // ========================================================================
    // Corporate Actions Methods - Signal Branch Coverage
    // ========================================================================

    describe('corporateActions - signal branch coverage', () => {
      it('corporateActions.get() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.corporateActions.get(
          { symbols: 'AAPL' },
          { signal: controller.signal }
        )

        expect(result.corporate_actions).toBeDefined()
      })
    })

    // ========================================================================
    // Forex Methods - Signal Branch Coverage
    // ========================================================================

    describe('forex - signal branch coverage', () => {
      it('forex.getLatestRates() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.forex.getLatestRates(
          { currency_pairs: 'EUR/USD' },
          { signal: controller.signal }
        )

        expect(result.rates).toHaveProperty('EUR/USD')
      })

      it('forex.getRates() with signal option', async () => {
        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.forex.getRates(
          { currency_pairs: 'EUR/USD' },
          { signal: controller.signal }
        )

        expect(result.rates).toHaveProperty('EUR/USD')
      })
    })

    // ========================================================================
    // Logos Methods - Signal Branch Coverage
    // ========================================================================

    describe('logos - signal branch coverage', () => {
      it('logos.get() with signal option', async () => {
        let capturedRequest: Request | undefined

        server.use(
          http.get(`${BASE_URL}/v1beta1/logos/:symbol`, ({ request, params }) => {
            capturedRequest = request
            const symbol = params.symbol as string
            return HttpResponse.json({ symbol, url: `https://logos.example.com/${symbol}.png` })
          })
        )

        const client = createTestClient()
        const controller = new AbortController()

        const result = await client.logos.get(
          'AAPL',
          { placeholder: true },
          { signal: controller.signal }
        )

        expect(result).toBeDefined()
        expect(capturedRequest).toBeDefined()
      })
    })

    // ========================================================================
    // Logos Methods - Optional Params Branch Coverage
    // ========================================================================

    describe('logos - optional params branch coverage', () => {
      it('logos.get() without optional params', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/logos/:symbol`, ({ params }) => {
            const symbol = params.symbol as string
            return HttpResponse.json({ symbol, url: `https://logos.example.com/${symbol}.png` })
          })
        )

        const client = createTestClient()

        const result = await client.logos.get('AAPL')

        expect(result).toBeDefined()
      })
    })

    // ========================================================================
    // Error Branch Coverage Tests
    // ========================================================================

    describe('error branch coverage', () => {
      it('screener.getMovers() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/screener/:market_type/movers`, () => {
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.screener.getMovers('stocks')).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('corporateActions.get() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/corporate-actions`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.corporateActions.get({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('forex.getLatestRates() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/forex/latest/rates`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'currency_pairs is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.forex.getLatestRates({ currency_pairs: '' })).rejects.toMatchObject({
          message: 'currency_pairs is required',
        })
      })

      it('forex.getRates() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/forex/rates`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'currency_pairs is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.forex.getRates({ currency_pairs: '' })).rejects.toMatchObject({
          message: 'currency_pairs is required',
        })
      })

      it('logos.get() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/logos/:symbol`, () => {
            return HttpResponse.json(
              { code: 40400000, message: 'Symbol not found' },
              { status: 404 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.logos.get('INVALIDXYZ')).rejects.toMatchObject({
          message: 'Symbol not found',
        })
      })

      it('options.getSnapshots() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/options/snapshots`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.options.getSnapshots({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('options.getChain() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/options/snapshots/:underlying_symbol`, () => {
            return HttpResponse.json(
              { code: 40400000, message: 'Symbol not found' },
              { status: 404 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.options.getChain('INVALIDXYZ')).rejects.toMatchObject({
          message: 'Symbol not found',
        })
      })

      it('options.getExchanges() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/options/meta/exchanges`, () => {
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.options.getExchanges()).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('options.getConditions() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/options/meta/conditions/:ticktype`, () => {
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.options.getConditions('trade')).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('news.get() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/news`, () => {
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.news.get()).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('screener.getMostActives() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/screener/stocks/most-actives`, () => {
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.screener.getMostActives()).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('crypto.getSnapshots() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta3/crypto/:loc/snapshots`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.crypto.getSnapshots('us', { symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('crypto.getLatestOrderbooks() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta3/crypto/:loc/latest/orderbooks`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(
          client.crypto.getLatestOrderbooks('us', { symbols: '' })
        ).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('options.getBars() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/options/bars`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.options.getBars({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('options.getTrades() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/options/trades`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.options.getTrades({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('options.getLatestTrades() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/options/trades/latest`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.options.getLatestTrades({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('options.getLatestQuotes() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta1/options/quotes/latest`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.options.getLatestQuotes({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('crypto.getBars() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta3/crypto/:loc/bars`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.crypto.getBars('us', { symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('crypto.getLatestBars() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta3/crypto/:loc/latest/bars`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.crypto.getLatestBars('us', { symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('crypto.getTrades() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta3/crypto/:loc/trades`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.crypto.getTrades('us', { symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('crypto.getLatestTrades() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta3/crypto/:loc/latest/trades`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.crypto.getLatestTrades('us', { symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('crypto.getQuotes() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta3/crypto/:loc/quotes`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.crypto.getQuotes('us', { symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('crypto.getLatestQuotes() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1beta3/crypto/:loc/latest/quotes`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.crypto.getLatestQuotes('us', { symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('stocks.getSnapshots() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/snapshots`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getSnapshots({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('stocks.getSnapshot() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/:symbol/snapshot`, () => {
            return HttpResponse.json(
              { code: 40400000, message: 'Symbol not found' },
              { status: 404 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getSnapshot('INVALIDXYZ')).rejects.toMatchObject({
          message: 'Symbol not found',
        })
      })

      it('stocks.getAuctions() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/auctions`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getAuctions({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('stocks.getSymbolAuctions() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/:symbol/auctions`, () => {
            return HttpResponse.json(
              { code: 40400000, message: 'Symbol not found' },
              { status: 404 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getSymbolAuctions('INVALIDXYZ')).rejects.toMatchObject({
          message: 'Symbol not found',
        })
      })

      it('stocks.getExchanges() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/meta/exchanges`, () => {
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getExchanges()).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('stocks.getConditions() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/meta/conditions/:ticktype`, () => {
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getConditions('trade', { tape: 'A' })).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('stocks.getLatestTrades() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/trades/latest`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getLatestTrades({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('stocks.getLatestTrade() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/:symbol/trades/latest`, () => {
            return HttpResponse.json(
              { code: 40400000, message: 'Symbol not found' },
              { status: 404 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getLatestTrade('INVALIDXYZ')).rejects.toMatchObject({
          message: 'Symbol not found',
        })
      })

      it('stocks.getQuotes() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/quotes`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getQuotes({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('stocks.getSymbolQuotes() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/:symbol/quotes`, () => {
            return HttpResponse.json(
              { code: 40400000, message: 'Symbol not found' },
              { status: 404 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getSymbolQuotes('INVALIDXYZ')).rejects.toMatchObject({
          message: 'Symbol not found',
        })
      })

      it('stocks.getLatestQuotes() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/quotes/latest`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getLatestQuotes({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('stocks.getLatestQuote() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/:symbol/quotes/latest`, () => {
            return HttpResponse.json(
              { code: 40400000, message: 'Symbol not found' },
              { status: 404 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getLatestQuote('INVALIDXYZ')).rejects.toMatchObject({
          message: 'Symbol not found',
        })
      })

      it('stocks.getSymbolBars() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/:symbol/bars`, () => {
            return HttpResponse.json(
              { code: 40400000, message: 'Symbol not found' },
              { status: 404 }
            )
          })
        )

        const client = createTestClient()

        await expect(
          client.stocks.getSymbolBars('INVALIDXYZ', { timeframe: '1Day' })
        ).rejects.toMatchObject({
          message: 'Symbol not found',
        })
      })

      it('stocks.getLatestBars() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/bars/latest`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getLatestBars({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('stocks.getLatestBar() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/:symbol/bars/latest`, () => {
            return HttpResponse.json(
              { code: 40400000, message: 'Symbol not found' },
              { status: 404 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getLatestBar('INVALIDXYZ')).rejects.toMatchObject({
          message: 'Symbol not found',
        })
      })

      it('stocks.getTrades() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/trades`, () => {
            return HttpResponse.json(
              { code: 42210000, message: 'symbols is required' },
              { status: 422 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getTrades({ symbols: '' })).rejects.toMatchObject({
          message: 'symbols is required',
        })
      })

      it('stocks.getSymbolTrades() throws on error response', async () => {
        server.use(
          http.get(`${BASE_URL}/v2/stocks/:symbol/trades`, () => {
            return HttpResponse.json(
              { code: 40400000, message: 'Symbol not found' },
              { status: 404 }
            )
          })
        )

        const client = createTestClient()

        await expect(client.stocks.getSymbolTrades('INVALIDXYZ')).rejects.toMatchObject({
          message: 'Symbol not found',
        })
      })
    })
  })
})
