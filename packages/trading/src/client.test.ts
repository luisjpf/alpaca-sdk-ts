/**
 * Unit tests for the Trading API client
 *
 * These tests validate the trading client's behavior by mocking all HTTP
 * requests with MSW (Mock Service Worker). No actual API calls are made.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createTradingClient } from './client'
import type { Account, Order, Position, Clock } from './client'

// Paper trading base URL
const BASE_URL = 'https://paper-api.alpaca.markets'

// Test configuration - credentials are fake since all calls are mocked
const TEST_CONFIG = {
  keyId: 'test-key-id',
  secretKey: 'test-secret-key',
  paper: true,
}

// Mock data fixtures
const mockAccount: Account = {
  id: 'account-123',
  account_number: '123456789',
  status: 'ACTIVE',
  currency: 'USD',
  cash: '10000.00',
  portfolio_value: '15000.00',
  pattern_day_trader: false,
  trading_blocked: false,
  transfers_blocked: false,
  account_blocked: false,
  created_at: '2024-01-01T00:00:00Z',
  trade_suspended_by_user: false,
  shorting_enabled: true,
  equity: '15000.00',
  last_equity: '14500.00',
  long_market_value: '5000.00',
  short_market_value: '0.00',
  initial_margin: '2500.00',
  maintenance_margin: '1500.00',
  last_maintenance_margin: '1400.00',
  daytrade_count: 0,
  daytrading_buying_power: '40000.00',
  regt_buying_power: '20000.00',
  buying_power: '20000.00',
  sma: '0.00',
  multiplier: '4',
}

const mockOrder: Order = {
  id: 'order-123',
  client_order_id: 'client-order-123',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  submitted_at: '2024-01-15T10:30:00Z',
  asset_id: 'asset-123',
  symbol: 'AAPL',
  asset_class: 'us_equity',
  qty: '10',
  filled_qty: '0',
  type: 'market',
  side: 'buy',
  time_in_force: 'day',
  status: 'new',
  extended_hours: false,
  legs: null,
}

const mockPosition: Position = {
  asset_id: 'asset-123',
  symbol: 'AAPL',
  exchange: 'NASDAQ',
  asset_class: 'us_equity',
  avg_entry_price: '150.00',
  qty: '10',
  side: 'long',
  market_value: '1600.00',
  cost_basis: '1500.00',
  unrealized_pl: '100.00',
  unrealized_plpc: '0.0667',
  unrealized_intraday_pl: '50.00',
  unrealized_intraday_plpc: '0.0333',
  current_price: '160.00',
  lastday_price: '155.00',
  change_today: '0.0323',
  qty_available: '10',
}

const mockClock: Clock = {
  timestamp: '2024-01-15T14:30:00-05:00',
  is_open: true,
  next_open: '2024-01-16T09:30:00-05:00',
  next_close: '2024-01-15T16:00:00-05:00',
}

const mockAsset = {
  id: 'asset-123',
  class: 'us_equity',
  exchange: 'NASDAQ',
  symbol: 'AAPL',
  name: 'Apple Inc.',
  status: 'active',
  tradable: true,
  marginable: true,
  shortable: true,
  easy_to_borrow: true,
  fractionable: true,
}

// MSW server setup
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('createTradingClient', () => {
  it('should create a client object with all expected namespaces', () => {
    const client = createTradingClient(TEST_CONFIG)

    expect(client).toBeDefined()
    expect(client.raw).toBeDefined()
    expect(client.account).toBeDefined()
    expect(client.orders).toBeDefined()
    expect(client.positions).toBeDefined()
    expect(client.assets).toBeDefined()
    expect(client.clock).toBeDefined()
    expect(client.calendar).toBeDefined()
    expect(client.watchlists).toBeDefined()
  })

  it('should expose expected methods on each namespace', () => {
    const client = createTradingClient(TEST_CONFIG)

    // Account methods
    expect(typeof client.account.get).toBe('function')
    expect(typeof client.account.getConfigurations).toBe('function')
    expect(typeof client.account.updateConfigurations).toBe('function')
    expect(typeof client.account.getActivities).toBe('function')
    expect(typeof client.account.getPortfolioHistory).toBe('function')

    // Order methods
    expect(typeof client.orders.list).toBe('function')
    expect(typeof client.orders.get).toBe('function')
    expect(typeof client.orders.getByClientOrderId).toBe('function')
    expect(typeof client.orders.create).toBe('function')
    expect(typeof client.orders.replace).toBe('function')
    expect(typeof client.orders.cancel).toBe('function')
    expect(typeof client.orders.cancelAll).toBe('function')

    // Position methods
    expect(typeof client.positions.list).toBe('function')
    expect(typeof client.positions.get).toBe('function')
    expect(typeof client.positions.close).toBe('function')
    expect(typeof client.positions.closeAll).toBe('function')

    // Asset methods
    expect(typeof client.assets.list).toBe('function')
    expect(typeof client.assets.get).toBe('function')

    // Clock methods
    expect(typeof client.clock.get).toBe('function')

    // Calendar methods
    expect(typeof client.calendar.get).toBe('function')

    // Watchlist methods
    expect(typeof client.watchlists.list).toBe('function')
    expect(typeof client.watchlists.get).toBe('function')
    expect(typeof client.watchlists.create).toBe('function')
    expect(typeof client.watchlists.update).toBe('function')
    expect(typeof client.watchlists.addSymbol).toBe('function')
    expect(typeof client.watchlists.removeSymbol).toBe('function')
    expect(typeof client.watchlists.delete).toBe('function')
  })
})

describe('account.get()', () => {
  it('should return account data when API responds successfully', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account`, () => {
        return HttpResponse.json(mockAccount)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const account = await client.account.get()

    expect(account).toEqual(mockAccount)
    expect(account.id).toBe('account-123')
    expect(account.status).toBe('ACTIVE')
    expect(account.cash).toBe('10000.00')
  })

  it('should include correct authorization headers', async () => {
    let capturedHeaders: Headers | null = null

    server.use(
      http.get(`${BASE_URL}/v2/account`, ({ request }) => {
        capturedHeaders = request.headers
        return HttpResponse.json(mockAccount)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await client.account.get()

    expect(capturedHeaders).not.toBeNull()
    expect(capturedHeaders!.get('APCA-API-KEY-ID')).toBe('test-key-id')
    expect(capturedHeaders!.get('APCA-API-SECRET-KEY')).toBe('test-secret-key')
  })
})

describe('orders.list()', () => {
  it('should return an array of orders', async () => {
    const mockOrders = [mockOrder, { ...mockOrder, id: 'order-456', symbol: 'MSFT' }]

    server.use(
      http.get(`${BASE_URL}/v2/orders`, () => {
        return HttpResponse.json(mockOrders)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const orders = await client.orders.list()

    expect(Array.isArray(orders)).toBe(true)
    expect(orders).toHaveLength(2)
    expect(orders[0].id).toBe('order-123')
    expect(orders[1].symbol).toBe('MSFT')
  })

  it('should return empty array when no orders exist', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/orders`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const orders = await client.orders.list()

    expect(orders).toEqual([])
  })

  it('should pass query parameters correctly', async () => {
    let capturedUrl: URL | null = null

    server.use(
      http.get(`${BASE_URL}/v2/orders`, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json([mockOrder])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await client.orders.list({ status: 'open', limit: 50 })

    expect(capturedUrl).not.toBeNull()
    expect(capturedUrl!.searchParams.get('status')).toBe('open')
    expect(capturedUrl!.searchParams.get('limit')).toBe('50')
  })
})

describe('orders.create()', () => {
  it('should send correct request body for market order', async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE_URL}/v2/orders`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockOrder, { status: 201 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const orderRequest = {
      symbol: 'AAPL',
      qty: '10',
      side: 'buy' as const,
      type: 'market' as const,
      time_in_force: 'day' as const,
    }

    const order = await client.orders.create(orderRequest)

    expect(capturedBody).toEqual(orderRequest)
    expect(order.id).toBe('order-123')
  })

  it('should send correct request body for limit order with all parameters', async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE_URL}/v2/orders`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockOrder, { status: 201 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const orderRequest = {
      symbol: 'AAPL',
      qty: '10',
      side: 'buy' as const,
      type: 'limit' as const,
      time_in_force: 'gtc' as const,
      limit_price: '150.00',
      extended_hours: true,
      client_order_id: 'my-custom-id',
    }

    await client.orders.create(orderRequest)

    expect(capturedBody).toEqual(orderRequest)
  })
})

describe('orders.get()', () => {
  it('should fetch a single order by ID', async () => {
    const orderId = 'order-123'

    server.use(
      http.get(`${BASE_URL}/v2/orders/${orderId}`, () => {
        return HttpResponse.json(mockOrder)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const order = await client.orders.get(orderId)

    expect(order.id).toBe(orderId)
    expect(order.symbol).toBe('AAPL')
  })

  it('should call the correct endpoint with order ID in path', async () => {
    let capturedPath: string | null = null
    const orderId = 'specific-order-id-456'

    server.use(
      http.get(`${BASE_URL}/v2/orders/:orderId`, ({ params }) => {
        capturedPath = params.orderId as string
        return HttpResponse.json({ ...mockOrder, id: orderId })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await client.orders.get(orderId)

    expect(capturedPath).toBe(orderId)
  })
})

describe('orders.cancel()', () => {
  it('should call DELETE endpoint for order cancellation', async () => {
    let deleteWasCalled = false
    const orderId = 'order-to-cancel'

    server.use(
      http.delete(`${BASE_URL}/v2/orders/${orderId}`, () => {
        deleteWasCalled = true
        return new HttpResponse(null, { status: 204 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await client.orders.cancel(orderId)

    expect(deleteWasCalled).toBe(true)
  })

  it('should resolve without error on successful cancellation', async () => {
    const orderId = 'order-to-cancel'

    server.use(
      http.delete(`${BASE_URL}/v2/orders/${orderId}`, () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)

    // Should not throw
    await expect(client.orders.cancel(orderId)).resolves.toBeUndefined()
  })
})

describe('positions.list()', () => {
  it('should return an array of positions', async () => {
    const mockPositions = [
      mockPosition,
      { ...mockPosition, symbol: 'MSFT', asset_id: 'asset-456' },
    ]

    server.use(
      http.get(`${BASE_URL}/v2/positions`, () => {
        return HttpResponse.json(mockPositions)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const positions = await client.positions.list()

    expect(Array.isArray(positions)).toBe(true)
    expect(positions).toHaveLength(2)
    expect(positions[0].symbol).toBe('AAPL')
    expect(positions[1].symbol).toBe('MSFT')
  })

  it('should return empty array when no positions exist', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/positions`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const positions = await client.positions.list()

    expect(positions).toEqual([])
  })
})

describe('positions.get()', () => {
  it('should fetch a single position by symbol', async () => {
    const symbol = 'AAPL'

    server.use(
      http.get(`${BASE_URL}/v2/positions/${symbol}`, () => {
        return HttpResponse.json(mockPosition)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const position = await client.positions.get(symbol)

    expect(position.symbol).toBe('AAPL')
    expect(position.qty).toBe('10')
  })

  it('should fetch a single position by asset ID', async () => {
    const assetId = 'asset-123'

    server.use(
      http.get(`${BASE_URL}/v2/positions/${assetId}`, () => {
        return HttpResponse.json(mockPosition)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const position = await client.positions.get(assetId)

    expect(position.asset_id).toBe('asset-123')
  })
})

describe('assets.list()', () => {
  it('should return an array of assets', async () => {
    const mockAssets = [
      mockAsset,
      { ...mockAsset, id: 'asset-456', symbol: 'MSFT', name: 'Microsoft Corporation' },
    ]

    server.use(
      http.get(`${BASE_URL}/v2/assets`, () => {
        return HttpResponse.json(mockAssets)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const assets = await client.assets.list()

    expect(Array.isArray(assets)).toBe(true)
    expect(assets).toHaveLength(2)
  })

  it('should pass query parameters correctly', async () => {
    let capturedUrl: URL | null = null

    server.use(
      http.get(`${BASE_URL}/v2/assets`, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json([mockAsset])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await client.assets.list({ status: 'active', asset_class: 'us_equity' })

    expect(capturedUrl).not.toBeNull()
    expect(capturedUrl!.searchParams.get('status')).toBe('active')
    expect(capturedUrl!.searchParams.get('asset_class')).toBe('us_equity')
  })

  it('should filter assets by exchange', async () => {
    let capturedUrl: URL | null = null

    server.use(
      http.get(`${BASE_URL}/v2/assets`, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json([mockAsset])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await client.assets.list({ exchange: 'NASDAQ' })

    expect(capturedUrl!.searchParams.get('exchange')).toBe('NASDAQ')
  })
})

describe('clock.get()', () => {
  it('should return market clock data', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/clock`, () => {
        return HttpResponse.json(mockClock)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const clock = await client.clock.get()

    expect(clock.is_open).toBe(true)
    expect(clock.timestamp).toBe('2024-01-15T14:30:00-05:00')
    expect(clock.next_open).toBeDefined()
    expect(clock.next_close).toBeDefined()
  })
})

describe('error handling', () => {
  it('should throw error when API returns 401 Unauthorized', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account`, () => {
        return HttpResponse.json(
          { code: 40110000, message: 'Invalid API credentials' },
          { status: 401 }
        )
      })
    )

    const client = createTradingClient(TEST_CONFIG)

    await expect(client.account.get()).rejects.toMatchObject({
      message: 'Invalid API credentials',
    })
  })

  it('should throw error when API returns 403 Forbidden', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account`, () => {
        return HttpResponse.json(
          { code: 40310000, message: 'Forbidden' },
          { status: 403 }
        )
      })
    )

    const client = createTradingClient(TEST_CONFIG)

    await expect(client.account.get()).rejects.toMatchObject({
      message: 'Forbidden',
    })
  })

  it('should throw error when API returns 404 Not Found', async () => {
    const nonExistentOrderId = 'non-existent-order'

    server.use(
      http.get(`${BASE_URL}/v2/orders/${nonExistentOrderId}`, () => {
        return HttpResponse.json(
          { code: 40410000, message: 'Order not found' },
          { status: 404 }
        )
      })
    )

    const client = createTradingClient(TEST_CONFIG)

    await expect(client.orders.get(nonExistentOrderId)).rejects.toMatchObject({
      message: 'Order not found',
    })
  })

  it('should throw error when API returns 422 Unprocessable Entity', async () => {
    server.use(
      http.post(`${BASE_URL}/v2/orders`, () => {
        return HttpResponse.json(
          { code: 42210000, message: 'Insufficient buying power' },
          { status: 422 }
        )
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const invalidOrder = {
      symbol: 'AAPL',
      qty: '1000000',
      side: 'buy' as const,
      type: 'market' as const,
      time_in_force: 'day' as const,
    }

    await expect(client.orders.create(invalidOrder)).rejects.toMatchObject({
      message: 'Insufficient buying power',
    })
  })

  it('should throw error when API returns 500 Internal Server Error', async () => {
    // Disable retries for this test by using custom config
    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }

    server.use(
      http.get(`${BASE_URL}/v2/account`, () => {
        return HttpResponse.json(
          { code: 50010000, message: 'Internal server error' },
          { status: 500 }
        )
      })
    )

    const client = createTradingClient(noRetryConfig)

    await expect(client.account.get()).rejects.toMatchObject({
      message: 'Internal server error',
    })
  })

  it('should throw error when position not found', async () => {
    const nonExistentSymbol = 'INVALID'

    server.use(
      http.get(`${BASE_URL}/v2/positions/${nonExistentSymbol}`, () => {
        return HttpResponse.json(
          { code: 40410000, message: 'Position does not exist' },
          { status: 404 }
        )
      })
    )

    const client = createTradingClient(TEST_CONFIG)

    await expect(client.positions.get(nonExistentSymbol)).rejects.toMatchObject({
      message: 'Position does not exist',
    })
  })

  it('should throw error when order cannot be cancelled', async () => {
    const filledOrderId = 'filled-order'

    server.use(
      http.delete(`${BASE_URL}/v2/orders/${filledOrderId}`, () => {
        return HttpResponse.json(
          { code: 42210000, message: 'Order is not cancelable' },
          { status: 422 }
        )
      })
    )

    const client = createTradingClient(TEST_CONFIG)

    await expect(client.orders.cancel(filledOrderId)).rejects.toMatchObject({
      message: 'Order is not cancelable',
    })
  })
})

describe('additional endpoint coverage', () => {
  it('orders.getByClientOrderId() should fetch order by client order ID', async () => {
    const clientOrderId = 'my-client-order-id'

    server.use(
      http.get(`${BASE_URL}/v2/orders:by_client_order_id`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('client_order_id')).toBe(clientOrderId)
        return HttpResponse.json({ ...mockOrder, client_order_id: clientOrderId })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const order = await client.orders.getByClientOrderId(clientOrderId)

    expect(order.client_order_id).toBe(clientOrderId)
  })

  it('orders.replace() should update an existing order', async () => {
    let capturedBody: unknown = null
    const orderId = 'order-to-replace'

    server.use(
      http.patch(`${BASE_URL}/v2/orders/${orderId}`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockOrder, id: orderId, qty: '20' })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const updates = { qty: '20' }
    const order = await client.orders.replace(orderId, updates)

    expect(capturedBody).toEqual(updates)
    expect(order.qty).toBe('20')
  })

  it('orders.cancelAll() should cancel all open orders', async () => {
    let deleteWasCalled = false

    server.use(
      http.delete(`${BASE_URL}/v2/orders`, () => {
        deleteWasCalled = true
        return HttpResponse.json([{ id: 'order-1' }, { id: 'order-2' }])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const cancelledOrders = await client.orders.cancelAll()

    expect(deleteWasCalled).toBe(true)
    expect(cancelledOrders).toHaveLength(2)
  })

  it('positions.close() should close a single position', async () => {
    const symbol = 'AAPL'

    server.use(
      http.delete(`${BASE_URL}/v2/positions/${symbol}`, () => {
        return HttpResponse.json(mockOrder)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const closingOrder = await client.positions.close(symbol)

    expect(closingOrder).toBeDefined()
  })

  it('positions.closeAll() should close all positions', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/positions`, () => {
        return HttpResponse.json([mockOrder, { ...mockOrder, id: 'order-2' }])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const closingOrders = await client.positions.closeAll()

    expect(closingOrders).toHaveLength(2)
  })

  it('assets.get() should fetch a single asset', async () => {
    const symbol = 'AAPL'

    server.use(
      http.get(`${BASE_URL}/v2/assets/${symbol}`, () => {
        return HttpResponse.json(mockAsset)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const asset = await client.assets.get(symbol)

    expect(asset.symbol).toBe('AAPL')
  })

  it('calendar.get() should return market calendar', async () => {
    const mockCalendar = [
      { date: '2024-01-15', open: '09:30', close: '16:00' },
      { date: '2024-01-16', open: '09:30', close: '16:00' },
    ]

    server.use(
      http.get(`${BASE_URL}/v2/calendar`, () => {
        return HttpResponse.json(mockCalendar)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const calendar = await client.calendar.get()

    expect(Array.isArray(calendar)).toBe(true)
    expect(calendar).toHaveLength(2)
  })

  it('account.getConfigurations() should return account configurations', async () => {
    const mockConfigs = {
      dtbp_check: 'entry',
      no_shorting: false,
      suspend_trade: false,
      trade_confirm_email: 'all',
    }

    server.use(
      http.get(`${BASE_URL}/v2/account/configurations`, () => {
        return HttpResponse.json(mockConfigs)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const configs = await client.account.getConfigurations()

    expect(configs.dtbp_check).toBe('entry')
  })

  it('account.updateConfigurations() should update account configurations', async () => {
    let capturedBody: unknown = null

    server.use(
      http.patch(`${BASE_URL}/v2/account/configurations`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ no_shorting: true })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await client.account.updateConfigurations({ no_shorting: true })

    expect(capturedBody).toEqual({ no_shorting: true })
  })

  it('account.getActivities() should return account activities', async () => {
    const mockActivities = [
      { id: 'activity-1', activity_type: 'FILL' },
      { id: 'activity-2', activity_type: 'DIV' },
    ]

    server.use(
      http.get(`${BASE_URL}/v2/account/activities`, () => {
        return HttpResponse.json(mockActivities)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const activities = await client.account.getActivities()

    expect(activities).toHaveLength(2)
  })

  it('account.getPortfolioHistory() should return portfolio history', async () => {
    const mockHistory = {
      timestamp: [1705320000, 1705406400],
      equity: [10000, 10500],
      profit_loss: [0, 500],
      profit_loss_pct: [0, 0.05],
      base_value: 10000,
      timeframe: '1D',
    }

    server.use(
      http.get(`${BASE_URL}/v2/account/portfolio/history`, () => {
        return HttpResponse.json(mockHistory)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const history = await client.account.getPortfolioHistory({ period: '1W' })

    expect(history.equity).toHaveLength(2)
    expect(history.base_value).toBe(10000)
  })

  it('watchlists.list() should return all watchlists', async () => {
    const mockWatchlists = [
      { id: 'wl-1', name: 'Tech Stocks' },
      { id: 'wl-2', name: 'Value Plays' },
    ]

    server.use(
      http.get(`${BASE_URL}/v2/watchlists`, () => {
        return HttpResponse.json(mockWatchlists)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const watchlists = await client.watchlists.list()

    expect(watchlists).toHaveLength(2)
  })

  it('watchlists.create() should create a new watchlist', async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE_URL}/v2/watchlists`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ id: 'wl-new', name: 'My Watchlist' }, { status: 201 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const watchlist = await client.watchlists.create({
      name: 'My Watchlist',
      symbols: ['AAPL', 'MSFT'],
    })

    expect(capturedBody).toEqual({ name: 'My Watchlist', symbols: ['AAPL', 'MSFT'] })
    expect(watchlist.name).toBe('My Watchlist')
  })
})

describe('watchlists', () => {
  const mockWatchlist = {
    id: 'wl-123',
    account_id: 'account-123',
    name: 'Tech Stocks',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    assets: [
      { id: 'asset-1', symbol: 'AAPL', class: 'us_equity', exchange: 'NASDAQ' },
      { id: 'asset-2', symbol: 'MSFT', class: 'us_equity', exchange: 'NASDAQ' },
    ],
  }

  describe('watchlists.get()', () => {
    it('should fetch a single watchlist by ID', async () => {
      const watchlistId = 'wl-123'

      server.use(
        http.get(`${BASE_URL}/v2/watchlists/${watchlistId}`, () => {
          return HttpResponse.json(mockWatchlist)
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      const watchlist = await client.watchlists.get(watchlistId)

      expect(watchlist.id).toBe('wl-123')
      expect(watchlist.name).toBe('Tech Stocks')
    })

    it('should call the correct endpoint with watchlist ID in path', async () => {
      let capturedPath: string | null = null
      const watchlistId = 'specific-wl-id-456'

      server.use(
        http.get(`${BASE_URL}/v2/watchlists/:watchlistId`, ({ params }) => {
          capturedPath = params.watchlistId as string
          return HttpResponse.json({ ...mockWatchlist, id: watchlistId })
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      await client.watchlists.get(watchlistId)

      expect(capturedPath).toBe(watchlistId)
    })

    it('should throw error when watchlist not found', async () => {
      const nonExistentId = 'non-existent-wl'

      server.use(
        http.get(`${BASE_URL}/v2/watchlists/${nonExistentId}`, () => {
          return HttpResponse.json(
            { code: 40410000, message: 'Watchlist not found' },
            { status: 404 }
          )
        })
      )

      const client = createTradingClient(TEST_CONFIG)

      await expect(client.watchlists.get(nonExistentId)).rejects.toMatchObject({
        message: 'Watchlist not found',
      })
    })
  })

  describe('watchlists.create()', () => {
    it('should create a new watchlist with name only', async () => {
      let capturedBody: unknown = null

      server.use(
        http.post(`${BASE_URL}/v2/watchlists`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json(
            { ...mockWatchlist, id: 'wl-new', name: 'New Watchlist', assets: [] },
            { status: 201 }
          )
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      const watchlist = await client.watchlists.create({ name: 'New Watchlist' })

      expect(capturedBody).toEqual({ name: 'New Watchlist', symbols: [] })
      expect(watchlist.name).toBe('New Watchlist')
    })

    it('should create a new watchlist with name and symbols', async () => {
      let capturedBody: unknown = null

      server.use(
        http.post(`${BASE_URL}/v2/watchlists`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json(mockWatchlist, { status: 201 })
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      const watchlist = await client.watchlists.create({
        name: 'Tech Stocks',
        symbols: ['AAPL', 'MSFT'],
      })

      expect(capturedBody).toEqual({ name: 'Tech Stocks', symbols: ['AAPL', 'MSFT'] })
      expect(watchlist.id).toBe('wl-123')
    })

    it('should throw error when name is duplicate', async () => {
      server.use(
        http.post(`${BASE_URL}/v2/watchlists`, () => {
          return HttpResponse.json(
            { code: 42210000, message: 'Watchlist name already exists' },
            { status: 422 }
          )
        })
      )

      const client = createTradingClient(TEST_CONFIG)

      await expect(
        client.watchlists.create({ name: 'Existing Name' })
      ).rejects.toMatchObject({
        message: 'Watchlist name already exists',
      })
    })
  })

  describe('watchlists.update()', () => {
    it('should update a watchlist name', async () => {
      let capturedBody: unknown = null
      const watchlistId = 'wl-123'

      server.use(
        http.put(`${BASE_URL}/v2/watchlists/${watchlistId}`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ ...mockWatchlist, name: 'Updated Name' })
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      const watchlist = await client.watchlists.update(watchlistId, {
        name: 'Updated Name',
      })

      expect(capturedBody).toEqual({ name: 'Updated Name', symbols: [] })
      expect(watchlist.name).toBe('Updated Name')
    })

    it('should update a watchlist with new symbols', async () => {
      let capturedBody: unknown = null
      const watchlistId = 'wl-123'

      server.use(
        http.put(`${BASE_URL}/v2/watchlists/${watchlistId}`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            ...mockWatchlist,
            name: 'Tech Stocks',
            assets: [
              { id: 'asset-1', symbol: 'AAPL', class: 'us_equity', exchange: 'NASDAQ' },
              { id: 'asset-3', symbol: 'GOOGL', class: 'us_equity', exchange: 'NASDAQ' },
              { id: 'asset-4', symbol: 'NVDA', class: 'us_equity', exchange: 'NASDAQ' },
            ],
          })
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      const watchlist = await client.watchlists.update(watchlistId, {
        name: 'Tech Stocks',
        symbols: ['AAPL', 'GOOGL', 'NVDA'],
      })

      expect(capturedBody).toEqual({
        name: 'Tech Stocks',
        symbols: ['AAPL', 'GOOGL', 'NVDA'],
      })
      expect(watchlist.assets).toHaveLength(3)
    })

    it('should call PUT endpoint with correct path parameter', async () => {
      let capturedPath: string | null = null
      const watchlistId = 'specific-wl-id'

      server.use(
        http.put(`${BASE_URL}/v2/watchlists/:watchlistId`, ({ params }) => {
          capturedPath = params.watchlistId as string
          return HttpResponse.json(mockWatchlist)
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      await client.watchlists.update(watchlistId, { name: 'Test' })

      expect(capturedPath).toBe(watchlistId)
    })

    it('should throw error when watchlist not found', async () => {
      const nonExistentId = 'non-existent-wl'

      server.use(
        http.put(`${BASE_URL}/v2/watchlists/${nonExistentId}`, () => {
          return HttpResponse.json(
            { code: 40410000, message: 'Watchlist not found' },
            { status: 404 }
          )
        })
      )

      const client = createTradingClient(TEST_CONFIG)

      await expect(
        client.watchlists.update(nonExistentId, { name: 'New Name' })
      ).rejects.toMatchObject({
        message: 'Watchlist not found',
      })
    })
  })

  describe('watchlists.addSymbol()', () => {
    it('should add a symbol to a watchlist', async () => {
      let capturedBody: unknown = null
      const watchlistId = 'wl-123'
      const symbol = 'GOOGL'

      server.use(
        http.post(`${BASE_URL}/v2/watchlists/${watchlistId}`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            ...mockWatchlist,
            assets: [
              ...mockWatchlist.assets,
              { id: 'asset-3', symbol: 'GOOGL', class: 'us_equity', exchange: 'NASDAQ' },
            ],
          })
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      const watchlist = await client.watchlists.addSymbol(watchlistId, symbol)

      expect(capturedBody).toEqual({ symbol: 'GOOGL' })
      expect(watchlist.assets).toHaveLength(3)
    })

    it('should call POST endpoint with correct path parameter', async () => {
      let capturedPath: string | null = null
      const watchlistId = 'specific-wl-id'

      server.use(
        http.post(`${BASE_URL}/v2/watchlists/:watchlistId`, ({ params }) => {
          capturedPath = params.watchlistId as string
          return HttpResponse.json(mockWatchlist)
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      await client.watchlists.addSymbol(watchlistId, 'TSLA')

      expect(capturedPath).toBe(watchlistId)
    })

    it('should throw error when symbol is invalid', async () => {
      const watchlistId = 'wl-123'

      server.use(
        http.post(`${BASE_URL}/v2/watchlists/${watchlistId}`, () => {
          return HttpResponse.json(
            { code: 40010000, message: 'Invalid symbol' },
            { status: 400 }
          )
        })
      )

      const client = createTradingClient(TEST_CONFIG)

      await expect(
        client.watchlists.addSymbol(watchlistId, 'INVALID_SYMBOL')
      ).rejects.toMatchObject({
        message: 'Invalid symbol',
      })
    })

    it('should throw error when watchlist not found', async () => {
      const nonExistentId = 'non-existent-wl'

      server.use(
        http.post(`${BASE_URL}/v2/watchlists/${nonExistentId}`, () => {
          return HttpResponse.json(
            { code: 40410000, message: 'Watchlist not found' },
            { status: 404 }
          )
        })
      )

      const client = createTradingClient(TEST_CONFIG)

      await expect(
        client.watchlists.addSymbol(nonExistentId, 'AAPL')
      ).rejects.toMatchObject({
        message: 'Watchlist not found',
      })
    })
  })

  describe('watchlists.removeSymbol()', () => {
    it('should remove a symbol from a watchlist', async () => {
      let deleteWasCalled = false
      const watchlistId = 'wl-123'
      const symbol = 'MSFT'

      server.use(
        http.delete(`${BASE_URL}/v2/watchlists/${watchlistId}/${symbol}`, () => {
          deleteWasCalled = true
          return HttpResponse.json({
            ...mockWatchlist,
            assets: [mockWatchlist.assets[0]], // Only AAPL remains
          })
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      const watchlist = await client.watchlists.removeSymbol(watchlistId, symbol)

      expect(deleteWasCalled).toBe(true)
      expect(watchlist.assets).toHaveLength(1)
    })

    it('should call DELETE endpoint with correct path parameters', async () => {
      let capturedWatchlistId: string | null = null
      let capturedSymbol: string | null = null
      const watchlistId = 'specific-wl-id'
      const symbol = 'AAPL'

      server.use(
        http.delete(
          `${BASE_URL}/v2/watchlists/:watchlistId/:symbol`,
          ({ params }) => {
            capturedWatchlistId = params.watchlistId as string
            capturedSymbol = params.symbol as string
            return HttpResponse.json(mockWatchlist)
          }
        )
      )

      const client = createTradingClient(TEST_CONFIG)
      await client.watchlists.removeSymbol(watchlistId, symbol)

      expect(capturedWatchlistId).toBe(watchlistId)
      expect(capturedSymbol).toBe(symbol)
    })

    it('should throw error when symbol is not in watchlist', async () => {
      const watchlistId = 'wl-123'
      const symbol = 'TSLA'

      server.use(
        http.delete(`${BASE_URL}/v2/watchlists/${watchlistId}/${symbol}`, () => {
          return HttpResponse.json(
            { code: 40410000, message: 'Symbol not found in watchlist' },
            { status: 404 }
          )
        })
      )

      const client = createTradingClient(TEST_CONFIG)

      await expect(
        client.watchlists.removeSymbol(watchlistId, symbol)
      ).rejects.toMatchObject({
        message: 'Symbol not found in watchlist',
      })
    })

    it('should throw error when watchlist not found', async () => {
      const nonExistentId = 'non-existent-wl'
      const symbol = 'AAPL'

      server.use(
        http.delete(`${BASE_URL}/v2/watchlists/${nonExistentId}/${symbol}`, () => {
          return HttpResponse.json(
            { code: 40410000, message: 'Watchlist not found' },
            { status: 404 }
          )
        })
      )

      const client = createTradingClient(TEST_CONFIG)

      await expect(
        client.watchlists.removeSymbol(nonExistentId, symbol)
      ).rejects.toMatchObject({
        message: 'Watchlist not found',
      })
    })
  })

  describe('watchlists.delete()', () => {
    it('should delete a watchlist', async () => {
      let deleteWasCalled = false
      const watchlistId = 'wl-123'

      server.use(
        http.delete(`${BASE_URL}/v2/watchlists/${watchlistId}`, () => {
          deleteWasCalled = true
          return new HttpResponse(null, { status: 204 })
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      await client.watchlists.delete(watchlistId)

      expect(deleteWasCalled).toBe(true)
    })

    it('should call DELETE endpoint with correct path parameter', async () => {
      let capturedPath: string | null = null
      const watchlistId = 'specific-wl-to-delete'

      server.use(
        http.delete(`${BASE_URL}/v2/watchlists/:watchlistId`, ({ params }) => {
          capturedPath = params.watchlistId as string
          return new HttpResponse(null, { status: 204 })
        })
      )

      const client = createTradingClient(TEST_CONFIG)
      await client.watchlists.delete(watchlistId)

      expect(capturedPath).toBe(watchlistId)
    })

    it('should resolve without error on successful deletion', async () => {
      const watchlistId = 'wl-to-delete'

      server.use(
        http.delete(`${BASE_URL}/v2/watchlists/${watchlistId}`, () => {
          return new HttpResponse(null, { status: 204 })
        })
      )

      const client = createTradingClient(TEST_CONFIG)

      await expect(client.watchlists.delete(watchlistId)).resolves.toBeUndefined()
    })

    it('should throw error when watchlist not found', async () => {
      const nonExistentId = 'non-existent-wl'

      server.use(
        http.delete(`${BASE_URL}/v2/watchlists/${nonExistentId}`, () => {
          return HttpResponse.json(
            { code: 40410000, message: 'Watchlist not found' },
            { status: 404 }
          )
        })
      )

      const client = createTradingClient(TEST_CONFIG)

      await expect(client.watchlists.delete(nonExistentId)).rejects.toMatchObject({
        message: 'Watchlist not found',
      })
    })
  })
})

describe('options parameter branch coverage', () => {
  it('account.get() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account`, () => {
        return HttpResponse.json(mockAccount)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const account = await client.account.get({ signal: controller.signal })

    expect(account.id).toBe('account-123')
  })

  it('account.getConfigurations() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account/configurations`, () => {
        return HttpResponse.json({ dtbp_check: 'entry' })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const configs = await client.account.getConfigurations({ signal: controller.signal })

    expect(configs.dtbp_check).toBe('entry')
  })

  it('account.updateConfigurations() should accept options with signal', async () => {
    server.use(
      http.patch(`${BASE_URL}/v2/account/configurations`, () => {
        return HttpResponse.json({ no_shorting: true })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    await client.account.updateConfigurations({ no_shorting: true }, { signal: controller.signal })
  })

  it('account.getActivities() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account/activities`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const activities = await client.account.getActivities({}, { signal: controller.signal })

    expect(activities).toEqual([])
  })

  it('account.getPortfolioHistory() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account/portfolio/history`, () => {
        return HttpResponse.json({ equity: [], timestamp: [] })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    await client.account.getPortfolioHistory({}, { signal: controller.signal })
  })

  it('orders.list() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/orders`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const orders = await client.orders.list({}, { signal: controller.signal })

    expect(orders).toEqual([])
  })

  it('orders.get() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/orders/order-123`, () => {
        return HttpResponse.json(mockOrder)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const order = await client.orders.get('order-123', { signal: controller.signal })

    expect(order.id).toBe('order-123')
  })

  it('orders.getByClientOrderId() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/orders:by_client_order_id`, () => {
        return HttpResponse.json(mockOrder)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const order = await client.orders.getByClientOrderId('client-123', { signal: controller.signal })

    expect(order).toBeDefined()
  })

  it('orders.create() should accept options with signal', async () => {
    server.use(
      http.post(`${BASE_URL}/v2/orders`, () => {
        return HttpResponse.json(mockOrder, { status: 201 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const order = await client.orders.create(
      { symbol: 'AAPL', qty: '10', side: 'buy', type: 'market', time_in_force: 'day' },
      { signal: controller.signal }
    )

    expect(order.id).toBe('order-123')
  })

  it('orders.replace() should accept options with signal', async () => {
    server.use(
      http.patch(`${BASE_URL}/v2/orders/order-123`, () => {
        return HttpResponse.json(mockOrder)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    await client.orders.replace('order-123', { qty: '20' }, { signal: controller.signal })
  })

  it('orders.cancel() should accept options with signal', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/orders/order-123`, () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    await client.orders.cancel('order-123', { signal: controller.signal })
  })

  it('orders.cancelAll() should accept options with signal', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/orders`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const cancelled = await client.orders.cancelAll({ signal: controller.signal })

    expect(cancelled).toEqual([])
  })

  it('positions.list() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/positions`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const positions = await client.positions.list({ signal: controller.signal })

    expect(positions).toEqual([])
  })

  it('positions.get() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/positions/AAPL`, () => {
        return HttpResponse.json(mockPosition)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const position = await client.positions.get('AAPL', { signal: controller.signal })

    expect(position.symbol).toBe('AAPL')
  })

  it('positions.close() should accept options with signal', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/positions/AAPL`, () => {
        return HttpResponse.json(mockOrder)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    await client.positions.close('AAPL', {}, { signal: controller.signal })
  })

  it('positions.closeAll() should accept options with signal', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/positions`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const closed = await client.positions.closeAll({}, { signal: controller.signal })

    expect(closed).toEqual([])
  })

  it('assets.list() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/assets`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const assets = await client.assets.list({}, { signal: controller.signal })

    expect(assets).toEqual([])
  })

  it('assets.get() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/assets/AAPL`, () => {
        return HttpResponse.json(mockAsset)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const asset = await client.assets.get('AAPL', { signal: controller.signal })

    expect(asset.symbol).toBe('AAPL')
  })

  it('clock.get() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/clock`, () => {
        return HttpResponse.json(mockClock)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const clock = await client.clock.get({ signal: controller.signal })

    expect(clock.is_open).toBe(true)
  })

  it('calendar.get() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/calendar`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const calendar = await client.calendar.get({}, { signal: controller.signal })

    expect(calendar).toEqual([])
  })

  it('watchlists.list() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/watchlists`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const watchlists = await client.watchlists.list({ signal: controller.signal })

    expect(watchlists).toEqual([])
  })

  it('watchlists.get() should accept options with signal', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/watchlists/wl-123`, () => {
        return HttpResponse.json({ id: 'wl-123', name: 'Test' })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const watchlist = await client.watchlists.get('wl-123', { signal: controller.signal })

    expect(watchlist.id).toBe('wl-123')
  })

  it('watchlists.create() should accept options with signal', async () => {
    server.use(
      http.post(`${BASE_URL}/v2/watchlists`, () => {
        return HttpResponse.json({ id: 'wl-new', name: 'New' }, { status: 201 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const watchlist = await client.watchlists.create({ name: 'New' }, { signal: controller.signal })

    expect(watchlist.name).toBe('New')
  })

  it('watchlists.update() should accept options with signal', async () => {
    server.use(
      http.put(`${BASE_URL}/v2/watchlists/wl-123`, () => {
        return HttpResponse.json({ id: 'wl-123', name: 'Updated' })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    const watchlist = await client.watchlists.update('wl-123', { name: 'Updated' }, { signal: controller.signal })

    expect(watchlist.name).toBe('Updated')
  })

  it('watchlists.addSymbol() should accept options with signal', async () => {
    server.use(
      http.post(`${BASE_URL}/v2/watchlists/wl-123`, () => {
        return HttpResponse.json({ id: 'wl-123', assets: [] })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    await client.watchlists.addSymbol('wl-123', 'AAPL', { signal: controller.signal })
  })

  it('watchlists.removeSymbol() should accept options with signal', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/watchlists/wl-123/AAPL`, () => {
        return HttpResponse.json({ id: 'wl-123', assets: [] })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    await client.watchlists.removeSymbol('wl-123', 'AAPL', { signal: controller.signal })
  })

  it('watchlists.delete() should accept options with signal', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/watchlists/wl-123`, () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const controller = new AbortController()
    await client.watchlists.delete('wl-123', { signal: controller.signal })
  })

  it('watchlists.create() should use empty array when symbols not provided', async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE_URL}/v2/watchlists`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ id: 'wl-new', name: 'Test' }, { status: 201 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await client.watchlists.create({ name: 'Test' })

    expect(capturedBody).toEqual({ name: 'Test', symbols: [] })
  })

  it('watchlists.update() should use empty array when symbols not provided', async () => {
    let capturedBody: unknown = null

    server.use(
      http.put(`${BASE_URL}/v2/watchlists/wl-123`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ id: 'wl-123', name: 'Updated' })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await client.watchlists.update('wl-123', { name: 'Updated' })

    expect(capturedBody).toEqual({ name: 'Updated', symbols: [] })
  })

  it('watchlists.create() should pass symbols when provided', async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE_URL}/v2/watchlists`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ id: 'wl-new', name: 'Test' }, { status: 201 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await client.watchlists.create({ name: 'Test', symbols: ['AAPL', 'MSFT'] })

    expect(capturedBody).toEqual({ name: 'Test', symbols: ['AAPL', 'MSFT'] })
  })

  it('watchlists.update() should pass symbols when provided', async () => {
    let capturedBody: unknown = null

    server.use(
      http.put(`${BASE_URL}/v2/watchlists/wl-123`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ id: 'wl-123', name: 'Updated' })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await client.watchlists.update('wl-123', { name: 'Updated', symbols: ['GOOGL'] })

    expect(capturedBody).toEqual({ name: 'Updated', symbols: ['GOOGL'] })
  })

  // Test methods without optional params to cover both branches
  it('account.getActivities() without params', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account/activities`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const activities = await client.account.getActivities()

    expect(activities).toEqual([])
  })

  it('account.getPortfolioHistory() without params', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account/portfolio/history`, () => {
        return HttpResponse.json({ equity: [], timestamp: [] })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const history = await client.account.getPortfolioHistory()

    expect(history).toBeDefined()
  })

  it('orders.list() without params', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/orders`, () => {
        return HttpResponse.json([mockOrder])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const orders = await client.orders.list()

    expect(orders).toHaveLength(1)
  })

  it('positions.close() without params', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/positions/AAPL`, () => {
        return HttpResponse.json(mockOrder)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const result = await client.positions.close('AAPL')

    expect(result).toBeDefined()
  })

  it('positions.closeAll() without params', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/positions`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const closed = await client.positions.closeAll()

    expect(closed).toEqual([])
  })

  it('assets.list() without params', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/assets`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const assets = await client.assets.list()

    expect(assets).toEqual([])
  })

  it('calendar.get() without params', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/calendar`, () => {
        return HttpResponse.json([])
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const calendar = await client.calendar.get()

    expect(calendar).toEqual([])
  })

  // Test null data responses (data ?? [] branches)
  it('orders.list() handles null response', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/orders`, () => {
        return HttpResponse.json(null)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const orders = await client.orders.list()

    expect(orders).toEqual([])
  })

  it('account.getActivities() handles null response', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account/activities`, () => {
        return HttpResponse.json(null)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const activities = await client.account.getActivities()

    expect(activities).toEqual([])
  })

  it('positions.list() handles null response', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/positions`, () => {
        return HttpResponse.json(null)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const positions = await client.positions.list()

    expect(positions).toEqual([])
  })

  it('assets.list() handles null response', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/assets`, () => {
        return HttpResponse.json(null)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const assets = await client.assets.list()

    expect(assets).toEqual([])
  })

  it('orders.cancelAll() handles null response', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/orders`, () => {
        return HttpResponse.json(null)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const cancelled = await client.orders.cancelAll()

    expect(cancelled).toEqual([])
  })

  it('positions.closeAll() handles null response', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/positions`, () => {
        return HttpResponse.json(null)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const closed = await client.positions.closeAll()

    expect(closed).toEqual([])
  })

  it('calendar.get() handles null response', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/calendar`, () => {
        return HttpResponse.json(null)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const calendar = await client.calendar.get()

    expect(calendar).toEqual([])
  })

  it('watchlists.list() handles null response', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/watchlists`, () => {
        return HttpResponse.json(null)
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    const watchlists = await client.watchlists.list()

    expect(watchlists).toEqual([])
  })

  // Error throwing tests for remaining methods
  it('orders.getByClientOrderId() should throw on error', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/orders:by_client_order_id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await expect(client.orders.getByClientOrderId('invalid')).rejects.toBeDefined()
  })

  it('orders.replace() should throw on error', async () => {
    server.use(
      http.patch(`${BASE_URL}/v2/orders/order-123`, () => {
        return HttpResponse.json({ message: 'Invalid' }, { status: 422 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await expect(client.orders.replace('order-123', { qty: '10' })).rejects.toBeDefined()
  })

  it('assets.get() should throw on error', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/assets/INVALID`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await expect(client.assets.get('INVALID')).rejects.toBeDefined()
  })

  it('account.getConfigurations() should throw on error', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account/configurations`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }
    const client = createTradingClient(noRetryConfig)
    await expect(client.account.getConfigurations()).rejects.toBeDefined()
  })

  it('account.updateConfigurations() should throw on error', async () => {
    server.use(
      http.patch(`${BASE_URL}/v2/account/configurations`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 422 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await expect(client.account.updateConfigurations({ no_shorting: true })).rejects.toBeDefined()
  })

  it('account.getActivities() should throw on error', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account/activities`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }
    const client = createTradingClient(noRetryConfig)
    await expect(client.account.getActivities()).rejects.toBeDefined()
  })

  it('account.getPortfolioHistory() should throw on error', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/account/portfolio/history`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }
    const client = createTradingClient(noRetryConfig)
    await expect(client.account.getPortfolioHistory()).rejects.toBeDefined()
  })

  it('positions.close() should throw on error', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/positions/INVALID`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      })
    )

    const client = createTradingClient(TEST_CONFIG)
    await expect(client.positions.close('INVALID')).rejects.toBeDefined()
  })

  it('positions.closeAll() should throw on error', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/positions`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }
    const client = createTradingClient(noRetryConfig)
    await expect(client.positions.closeAll()).rejects.toBeDefined()
  })

  it('assets.list() should throw on error', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/assets`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }
    const client = createTradingClient(noRetryConfig)
    await expect(client.assets.list()).rejects.toBeDefined()
  })

  it('clock.get() should throw on error', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/clock`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }
    const client = createTradingClient(noRetryConfig)
    await expect(client.clock.get()).rejects.toBeDefined()
  })

  it('calendar.get() should throw on error', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/calendar`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }
    const client = createTradingClient(noRetryConfig)
    await expect(client.calendar.get()).rejects.toBeDefined()
  })

  it('watchlists.list() should throw on error', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/watchlists`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }
    const client = createTradingClient(noRetryConfig)
    await expect(client.watchlists.list()).rejects.toBeDefined()
  })

  it('orders.list() should throw on error', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/orders`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }
    const client = createTradingClient(noRetryConfig)
    await expect(client.orders.list()).rejects.toBeDefined()
  })

  it('orders.cancelAll() should throw on error', async () => {
    server.use(
      http.delete(`${BASE_URL}/v2/orders`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }
    const client = createTradingClient(noRetryConfig)
    await expect(client.orders.cancelAll()).rejects.toBeDefined()
  })

  it('positions.list() should throw on error', async () => {
    server.use(
      http.get(`${BASE_URL}/v2/positions`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    const noRetryConfig = { ...TEST_CONFIG, maxRetries: 0, baseUrl: BASE_URL }
    const client = createTradingClient(noRetryConfig)
    await expect(client.positions.list()).rejects.toBeDefined()
  })
})
