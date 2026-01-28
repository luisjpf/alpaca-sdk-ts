/**
 * Unit tests for the Broker API client
 *
 * These tests verify that the broker client correctly:
 * - Creates a client with Basic authentication
 * - Makes HTTP requests to the correct endpoints
 * - Handles successful responses
 * - Handles error responses appropriately
 *
 * All HTTP calls are mocked using MSW (Mock Service Worker) to prevent
 * any real API calls during testing.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createBrokerClient } from '../../src/broker/client'

// Base URL for the sandbox broker API
const BASE_URL = 'https://broker-api.sandbox.alpaca.markets'

// Test credentials
const TEST_KEY_ID = 'test-broker-key-id'
const TEST_SECRET_KEY = 'test-broker-secret-key'

// Expected Basic auth header value
const EXPECTED_AUTH = `Basic ${btoa(`${TEST_KEY_ID}:${TEST_SECRET_KEY}`)}`

// --------------------------------------------------------------------------
// Mock Data Fixtures
// --------------------------------------------------------------------------

const mockAccount = {
  id: 'acc-001',
  account_number: '123456789',
  status: 'ACTIVE',
  currency: 'USD',
  created_at: '2024-01-15T10:30:00Z',
  contact: {
    email_address: 'john.doe@example.com',
    phone_number: '+15551234567',
    street_address: ['123 Main St'],
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'USA',
  },
  identity: {
    given_name: 'John',
    family_name: 'Doe',
    date_of_birth: '1990-01-15',
    country_of_citizenship: 'USA',
    country_of_birth: 'USA',
    country_of_tax_residence: 'USA',
    funding_source: ['employment_income'],
  },
}

const mockAccountsList = [
  mockAccount,
  {
    ...mockAccount,
    id: 'acc-002',
    account_number: '987654321',
    contact: {
      ...mockAccount.contact,
      email_address: 'jane.smith@example.com',
    },
    identity: {
      ...mockAccount.identity,
      given_name: 'Jane',
      family_name: 'Smith',
    },
  },
]

const mockActivity = {
  id: 'act-001',
  activity_type: 'FILL',
  account_id: 'acc-001',
  date: '2024-01-20',
  net_amount: '1000.00',
  description: 'Trade execution',
}

const mockActivitiesList = [
  mockActivity,
  {
    ...mockActivity,
    id: 'act-002',
    activity_type: 'DIV',
    net_amount: '25.50',
    description: 'Dividend payment',
  },
]

const mockTransfer = {
  id: 'txn-001',
  account_id: 'acc-001',
  type: 'ach',
  status: 'COMPLETE',
  direction: 'INCOMING',
  amount: '5000.00',
  created_at: '2024-01-18T14:00:00Z',
}

const mockTransfersList = [
  mockTransfer,
  {
    ...mockTransfer,
    id: 'txn-002',
    status: 'PENDING',
    direction: 'OUTGOING',
    amount: '1000.00',
  },
]

const mockOrder = {
  id: 'ord-001',
  client_order_id: 'client-ord-001',
  created_at: '2024-01-20T09:30:00Z',
  updated_at: '2024-01-20T09:30:05Z',
  submitted_at: '2024-01-20T09:30:00Z',
  filled_at: '2024-01-20T09:30:05Z',
  asset_id: 'asset-001',
  symbol: 'AAPL',
  asset_class: 'us_equity',
  notional: null,
  qty: '10',
  filled_qty: '10',
  filled_avg_price: '185.50',
  order_class: '',
  order_type: 'market',
  type: 'market',
  side: 'buy',
  time_in_force: 'day',
  limit_price: null,
  stop_price: null,
  status: 'filled',
  extended_hours: false,
  legs: null,
}

const mockOrdersList = [
  mockOrder,
  {
    ...mockOrder,
    id: 'ord-002',
    client_order_id: 'client-ord-002',
    symbol: 'GOOGL',
    qty: '5',
    filled_qty: '5',
    filled_avg_price: '142.25',
    status: 'filled',
  },
]

const mockPosition = {
  asset_id: 'asset-001',
  symbol: 'AAPL',
  exchange: 'NASDAQ',
  asset_class: 'us_equity',
  avg_entry_price: '180.00',
  qty: '10',
  side: 'long',
  market_value: '1855.00',
  cost_basis: '1800.00',
  unrealized_pl: '55.00',
  unrealized_plpc: '0.0306',
  unrealized_intraday_pl: '12.50',
  unrealized_intraday_plpc: '0.0068',
  current_price: '185.50',
  lastday_price: '183.00',
  change_today: '0.0137',
}

const mockTradingAccount = {
  id: 'acc-001',
  account_number: '123456789',
  status: 'ACTIVE',
  currency: 'USD',
  buying_power: '100000.00',
  cash: '50000.00',
  portfolio_value: '75000.00',
  pattern_day_trader: false,
  trading_blocked: false,
  transfers_blocked: false,
  account_blocked: false,
  created_at: '2024-01-15T10:30:00Z',
  shorting_enabled: true,
  long_market_value: '25000.00',
  short_market_value: '0.00',
  equity: '75000.00',
  last_equity: '74500.00',
  multiplier: '2',
  initial_margin: '12500.00',
  maintenance_margin: '7500.00',
  last_maintenance_margin: '7500.00',
  sma: '50000.00',
  daytrade_count: 0,
}

const mockAchRelationship = {
  id: 'ach-rel-001',
  account_id: 'acc-001',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  status: 'APPROVED',
  account_owner_name: 'John Doe',
  bank_account_type: 'CHECKING',
  bank_account_number: '****1234',
  bank_routing_number: '121000358',
  nickname: 'Primary Checking',
}

const mockAchRelationshipsList = [
  mockAchRelationship,
  {
    ...mockAchRelationship,
    id: 'ach-rel-002',
    nickname: 'Secondary Savings',
    bank_account_type: 'SAVINGS',
  },
]

const mockDocument = {
  id: 'doc-001',
  name: 'Account Statement - January 2024',
  type: 'account_statement',
  sub_type: 'monthly',
  date: '2024-01-31',
  created_at: '2024-02-01T00:00:00Z',
}

const mockDocumentsList = [
  mockDocument,
  {
    ...mockDocument,
    id: 'doc-002',
    name: 'Trade Confirmation - AAPL',
    type: 'trade_confirmation',
    sub_type: null,
    date: '2024-01-20',
  },
]

const mockAsset = {
  id: 'asset-001',
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

const mockAssetsList = [
  mockAsset,
  {
    ...mockAsset,
    id: 'asset-002',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
  },
]

const mockCalendarDay = {
  date: '2024-01-22',
  open: '09:30',
  close: '16:00',
}

const mockCalendarList = [
  mockCalendarDay,
  {
    date: '2024-01-23',
    open: '09:30',
    close: '16:00',
  },
]

const mockClock = {
  timestamp: '2024-01-22T14:30:00-05:00',
  is_open: true,
  next_open: '2024-01-23T09:30:00-05:00',
  next_close: '2024-01-22T16:00:00-05:00',
}

const mockClosePositionOrder = {
  ...mockOrder,
  id: 'close-ord-001',
  side: 'sell',
  symbol: 'AAPL',
  qty: '10',
  status: 'pending_new',
}

const mockPositionsList = [
  mockPosition,
  {
    ...mockPosition,
    asset_id: 'asset-002',
    symbol: 'GOOGL',
    qty: '5',
    avg_entry_price: '140.00',
    market_value: '711.25',
    cost_basis: '700.00',
    unrealized_pl: '11.25',
    current_price: '142.25',
  },
]

// --------------------------------------------------------------------------
// MSW Request Handlers
// --------------------------------------------------------------------------

const handlers = [
  // IMPORTANT: More specific routes must come BEFORE wildcard routes
  // Activities endpoint (must be before /v1/accounts/:accountId)
  http.get(`${BASE_URL}/v1/accounts/activities`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(mockActivitiesList)
  }),

  // Error simulation endpoint - must be before generic :accountId handler
  http.get(`${BASE_URL}/v1/accounts/error-account`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json({ code: 50000000, message: 'Internal server error' }, { status: 500 })
  }),

  // Accounts list endpoint
  http.get(`${BASE_URL}/v1/accounts`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(mockAccountsList)
  }),

  // Get single account by ID (wildcard - must be after specific routes)
  http.get(`${BASE_URL}/v1/accounts/:accountId`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const account = mockAccountsList.find((a) => a.id === params.accountId)
    if (!account) {
      return HttpResponse.json({ code: 40410000, message: 'Account not found' }, { status: 404 })
    }
    return HttpResponse.json(account)
  }),

  // Create account
  http.post(`${BASE_URL}/v1/accounts`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    // Return a new account based on the request body
    return HttpResponse.json(
      {
        ...mockAccount,
        id: 'acc-new-001',
        account_number: '111222333',
        contact: (body as Record<string, unknown>).contact ?? mockAccount.contact,
        identity: (body as Record<string, unknown>).identity ?? mockAccount.identity,
      },
      { status: 201 }
    )
  }),

  // Transfers endpoints
  http.get(`${BASE_URL}/v1/accounts/:accountId/transfers`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    // Filter transfers by account
    const transfers = mockTransfersList.filter((t) => t.account_id === params.accountId)
    return HttpResponse.json(transfers)
  }),

  http.post(`${BASE_URL}/v1/accounts/:accountId/transfers`, async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      {
        id: 'txn-new-001',
        account_id: params.accountId,
        type: body.transfer_type ?? 'ach',
        status: 'PENDING',
        direction: body.direction ?? 'INCOMING',
        amount: body.amount ?? '1000.00',
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  // Trading Orders endpoints
  http.get(`${BASE_URL}/v1/trading/accounts/:accountId/orders`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(mockOrdersList)
  }),

  http.post(`${BASE_URL}/v1/trading/accounts/:accountId/orders`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      {
        ...mockOrder,
        id: 'ord-new-001',
        client_order_id: (body.client_order_id as string) ?? 'auto-generated',
        symbol: body.symbol,
        qty: body.qty,
        side: body.side,
        type: body.type,
        time_in_force: body.time_in_force,
        status: 'pending_new',
        filled_qty: '0',
        filled_avg_price: null,
      },
      { status: 201 }
    )
  }),

  // Trading Positions endpoint
  http.get(`${BASE_URL}/v1/trading/accounts/:accountId/positions`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(mockPositionsList)
  }),

  // PATCH account update
  http.patch(`${BASE_URL}/v1/accounts/:accountId`, async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const body = (await request.json()) as Record<string, unknown>
    const account = mockAccountsList.find((a) => a.id === params.accountId)
    if (!account) {
      return HttpResponse.json({ code: 40410000, message: 'Account not found' }, { status: 404 })
    }
    return HttpResponse.json({
      ...account,
      contact: body.contact ?? account.contact,
      identity: body.identity ?? account.identity,
    })
  }),

  // GET trading account details
  http.get(`${BASE_URL}/v1/trading/accounts/:accountId/account`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    if (params.accountId === 'non-existent') {
      return HttpResponse.json({ code: 40410000, message: 'Account not found' }, { status: 404 })
    }
    return HttpResponse.json(mockTradingAccount)
  }),

  // GET activities by type
  http.get(`${BASE_URL}/v1/accounts/activities/:activityType`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const filtered = mockActivitiesList.filter((a) => a.activity_type === params.activityType)
    return HttpResponse.json(filtered)
  }),

  // DELETE transfer
  http.delete(`${BASE_URL}/v1/accounts/:accountId/transfers/:transferId`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    if (params.transferId === 'non-existent') {
      return HttpResponse.json({ code: 40410000, message: 'Transfer not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // ACH Relationships endpoints
  http.get(`${BASE_URL}/v1/accounts/:accountId/ach_relationships`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(mockAchRelationshipsList)
  }),

  http.post(`${BASE_URL}/v1/accounts/:accountId/ach_relationships`, async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      {
        id: 'ach-rel-new-001',
        account_id: params.accountId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'QUEUED',
        account_owner_name: body.account_owner_name ?? 'Test User',
        bank_account_type: body.bank_account_type ?? 'CHECKING',
        bank_account_number: '****5678',
        bank_routing_number: body.bank_routing_number ?? '121000358',
        nickname: body.nickname ?? 'New Account',
      },
      { status: 201 }
    )
  }),

  http.delete(
    `${BASE_URL}/v1/accounts/:accountId/ach_relationships/:achRelationshipId`,
    ({ request, params }) => {
      const authHeader = request.headers.get('Authorization')
      if (authHeader !== EXPECTED_AUTH) {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
      if (params.achRelationshipId === 'non-existent') {
        return HttpResponse.json(
          { code: 40410000, message: 'ACH relationship not found' },
          { status: 404 }
        )
      }
      return new HttpResponse(null, { status: 204 })
    }
  ),

  // GET single order
  http.get(`${BASE_URL}/v1/trading/accounts/:accountId/orders/:orderId`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const order = mockOrdersList.find((o) => o.id === params.orderId)
    if (!order) {
      return HttpResponse.json({ code: 40410000, message: 'Order not found' }, { status: 404 })
    }
    return HttpResponse.json(order)
  }),

  // PATCH replace order
  http.patch(
    `${BASE_URL}/v1/trading/accounts/:accountId/orders/:orderId`,
    async ({ request, params }) => {
      const authHeader = request.headers.get('Authorization')
      if (authHeader !== EXPECTED_AUTH) {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
      const body = (await request.json()) as Record<string, unknown>
      const order = mockOrdersList.find((o) => o.id === params.orderId)
      if (!order) {
        return HttpResponse.json({ code: 40410000, message: 'Order not found' }, { status: 404 })
      }
      return HttpResponse.json({
        ...order,
        id: 'ord-replaced-001',
        qty: body.qty ?? order.qty,
        limit_price: body.limit_price ?? order.limit_price,
        stop_price: body.stop_price ?? order.stop_price,
        time_in_force: body.time_in_force ?? order.time_in_force,
        status: 'pending_replace',
      })
    }
  ),

  // DELETE cancel single order
  http.delete(
    `${BASE_URL}/v1/trading/accounts/:accountId/orders/:orderId`,
    ({ request, params }) => {
      const authHeader = request.headers.get('Authorization')
      if (authHeader !== EXPECTED_AUTH) {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
      if (params.orderId === 'non-existent') {
        return HttpResponse.json({ code: 40410000, message: 'Order not found' }, { status: 404 })
      }
      return new HttpResponse(null, { status: 204 })
    }
  ),

  // DELETE cancel all orders
  http.delete(`${BASE_URL}/v1/trading/accounts/:accountId/orders`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    // Return list of cancelled order statuses
    return HttpResponse.json([
      { id: 'ord-001', status: 200 },
      { id: 'ord-002', status: 200 },
    ])
  }),

  // GET single position
  http.get(
    `${BASE_URL}/v1/trading/accounts/:accountId/positions/:symbolOrAssetId`,
    ({ request, params }) => {
      const authHeader = request.headers.get('Authorization')
      if (authHeader !== EXPECTED_AUTH) {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
      const position = mockPositionsList.find(
        (p) => p.symbol === params.symbolOrAssetId || p.asset_id === params.symbolOrAssetId
      )
      if (!position) {
        return HttpResponse.json({ code: 40410000, message: 'Position not found' }, { status: 404 })
      }
      return HttpResponse.json(position)
    }
  ),

  // DELETE close single position
  http.delete(
    `${BASE_URL}/v1/trading/accounts/:accountId/positions/:symbolOrAssetId`,
    ({ request, params }) => {
      const authHeader = request.headers.get('Authorization')
      if (authHeader !== EXPECTED_AUTH) {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
      const position = mockPositionsList.find(
        (p) => p.symbol === params.symbolOrAssetId || p.asset_id === params.symbolOrAssetId
      )
      if (!position) {
        return HttpResponse.json({ code: 40410000, message: 'Position not found' }, { status: 404 })
      }
      // Return close order
      return HttpResponse.json({
        ...mockClosePositionOrder,
        symbol: position.symbol,
        qty: position.qty,
      })
    }
  ),

  // DELETE close all positions
  http.delete(`${BASE_URL}/v1/trading/accounts/:accountId/positions`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    // Return list of close orders
    return HttpResponse.json([
      { ...mockClosePositionOrder, symbol: 'AAPL' },
      { ...mockClosePositionOrder, id: 'close-ord-002', symbol: 'GOOGL' },
    ])
  }),

  // Documents endpoints
  http.get(`${BASE_URL}/v1/accounts/:accountId/documents`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(mockDocumentsList)
  }),

  http.get(
    `${BASE_URL}/v1/accounts/:accountId/documents/:documentId/download`,
    ({ request, params }) => {
      const authHeader = request.headers.get('Authorization')
      if (authHeader !== EXPECTED_AUTH) {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
      if (params.documentId === 'non-existent') {
        return HttpResponse.json({ code: 40410000, message: 'Document not found' }, { status: 404 })
      }
      // Return a download URL or content (depending on API design)
      const docId = String(params.documentId)
      return HttpResponse.json({
        download_url: `https://example.com/documents/${docId}/download`,
      })
    }
  ),

  // Assets endpoints
  http.get(`${BASE_URL}/v1/assets`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(mockAssetsList)
  }),

  http.get(`${BASE_URL}/v1/assets/:symbolOrAssetId`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const asset = mockAssetsList.find(
      (a) => a.symbol === params.symbolOrAssetId || a.id === params.symbolOrAssetId
    )
    if (!asset) {
      return HttpResponse.json({ code: 40410000, message: 'Asset not found' }, { status: 404 })
    }
    return HttpResponse.json(asset)
  }),

  // Calendar endpoint
  http.get(`${BASE_URL}/v1/calendar`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(mockCalendarList)
  }),

  // Clock endpoint
  http.get(`${BASE_URL}/v1/clock`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== EXPECTED_AUTH) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(mockClock)
  }),
]

// --------------------------------------------------------------------------
// MSW Server Setup
// --------------------------------------------------------------------------

const server = setupServer(...handlers)

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
// Tests
// --------------------------------------------------------------------------

describe('createBrokerClient', () => {
  describe('factory function', () => {
    it('should create a client object with expected methods', () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      // Verify client has expected structure
      expect(client).toBeDefined()
      expect(client.raw).toBeDefined()
      expect(client.accounts).toBeDefined()
      expect(client.activities).toBeDefined()
      expect(client.transfers).toBeDefined()
      expect(client.trading).toBeDefined()
      expect(client.trading.orders).toBeDefined()
      expect(client.trading.positions).toBeDefined()
    })

    it('should use Basic authentication headers', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      // Make a request and verify auth header is validated by our mock
      // If auth is incorrect, the mock returns 401
      const accounts = await client.accounts.list()
      expect(accounts).toEqual(mockAccountsList)
    })
  })

  describe('accounts.list()', () => {
    it('should return an array of accounts', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const accounts = await client.accounts.list()

      expect(Array.isArray(accounts)).toBe(true)
      expect(accounts).toHaveLength(2)
      expect(accounts[0]).toEqual(mockAccountsList[0])
      expect(accounts[1]).toEqual(mockAccountsList[1])
    })

    it('should return empty array when no accounts exist', async () => {
      server.use(
        http.get(`${BASE_URL}/v1/accounts`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const accounts = await client.accounts.list()

      expect(accounts).toEqual([])
    })
  })

  describe('accounts.get()', () => {
    it('should return a single account by ID', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const account = await client.accounts.get('acc-001')

      expect(account).toEqual(mockAccount)
      expect(account.id).toBe('acc-001')
      expect(account.contact.email_address).toBe('john.doe@example.com')
    })

    it('should throw error when account not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.accounts.get('non-existent-id')).rejects.toMatchObject({
        message: 'Account not found',
      })
    })
  })

  describe('accounts.create()', () => {
    it('should send correct request body and return created account', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const newAccountRequest = {
        contact: {
          email_address: 'newuser@example.com',
          phone_number: '+15559876543',
          street_address: ['456 Oak Ave'],
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94102',
        },
        identity: {
          given_name: 'Alice',
          family_name: 'Johnson',
          date_of_birth: '1985-05-20',
          country_of_citizenship: 'USA',
          country_of_birth: 'USA',
          country_of_tax_residence: 'USA',
          funding_source: ['employment_income'],
        },
        disclosures: {
          is_control_person: false,
          is_affiliated_exchange_or_finra: false,
          is_politically_exposed: false,
          immediate_family_exposed: false,
        },
        agreements: [
          {
            agreement: 'customer_agreement',
            signed_at: '2024-01-20T10:00:00Z',
            ip_address: '192.168.1.1',
          },
        ],
      }

      // Cast to bypass strict typing for test simplicity
      const account = await client.accounts.create(
        newAccountRequest as Parameters<typeof client.accounts.create>[0]
      )

      expect(account).toBeDefined()
      expect(account.id).toBe('acc-new-001')
    })
  })

  describe('activities.list()', () => {
    it('should return activities array', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const activities = await client.activities.list()

      expect(Array.isArray(activities)).toBe(true)
      expect(activities).toHaveLength(2)
      expect(activities[0].activity_type).toBe('FILL')
      expect(activities[1].activity_type).toBe('DIV')
    })

    it('should return empty array when no activities exist', async () => {
      server.use(
        http.get(`${BASE_URL}/v1/accounts/activities`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const activities = await client.activities.list()

      expect(activities).toEqual([])
    })
  })

  describe('transfers.list()', () => {
    it('should return transfers for account', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const transfers = await client.transfers.list('acc-001')

      expect(Array.isArray(transfers)).toBe(true)
      expect(transfers).toHaveLength(2)
      expect(transfers[0].status).toBe('COMPLETE')
      expect(transfers[1].status).toBe('PENDING')
    })

    it('should return empty array when account has no transfers', async () => {
      server.use(
        http.get(`${BASE_URL}/v1/accounts/:accountId/transfers`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const transfers = await client.transfers.list('acc-001')

      expect(transfers).toEqual([])
    })
  })

  describe('transfers.create()', () => {
    it('should create a transfer and return transfer object', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const transferRequest = {
        transfer_type: 'ach',
        direction: 'INCOMING',
        amount: '2500.00',
        relationship_id: 'ach-rel-001',
      }

      const transfer = await client.transfers.create(
        'acc-001',
        transferRequest as Parameters<typeof client.transfers.create>[1]
      )

      expect(transfer).toBeDefined()
      expect(transfer.id).toBe('txn-new-001')
      expect(transfer.status).toBe('PENDING')
      expect(transfer.account_id).toBe('acc-001')
    })
  })

  describe('trading.orders.list()', () => {
    it('should return orders for account', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const orders = await client.trading.orders.list('acc-001')

      expect(Array.isArray(orders)).toBe(true)
      expect(orders).toHaveLength(2)
      expect(orders[0].symbol).toBe('AAPL')
      expect(orders[0].status).toBe('filled')
      expect(orders[1].symbol).toBe('GOOGL')
    })

    it('should return empty array when account has no orders', async () => {
      server.use(
        http.get(`${BASE_URL}/v1/trading/accounts/:accountId/orders`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const orders = await client.trading.orders.list('acc-001')

      expect(orders).toEqual([])
    })
  })

  describe('trading.orders.create()', () => {
    it('should create an order and return order object', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const orderRequest = {
        symbol: 'TSLA',
        qty: '5',
        side: 'buy',
        type: 'market',
        time_in_force: 'day',
      }

      const order = await client.trading.orders.create(
        'acc-001',
        orderRequest as Parameters<typeof client.trading.orders.create>[1]
      )

      expect(order).toBeDefined()
      expect(order.id).toBe('ord-new-001')
      expect(order.symbol).toBe('TSLA')
      expect(order.qty).toBe('5')
      expect(order.side).toBe('buy')
      expect(order.status).toBe('pending_new')
    })

    it('should accept client_order_id in request', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const orderRequest = {
        symbol: 'MSFT',
        qty: '10',
        side: 'sell',
        type: 'limit',
        time_in_force: 'gtc',
        limit_price: '400.00',
        client_order_id: 'my-custom-order-id',
      }

      const order = await client.trading.orders.create(
        'acc-001',
        orderRequest as Parameters<typeof client.trading.orders.create>[1]
      )

      expect(order.client_order_id).toBe('my-custom-order-id')
    })
  })

  describe('trading.positions.list()', () => {
    it('should return positions for account', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const positions = await client.trading.positions.list('acc-001')

      expect(Array.isArray(positions)).toBe(true)
      expect(positions).toHaveLength(2)
      expect(positions[0].symbol).toBe('AAPL')
      expect(positions[0].qty).toBe('10')
      expect(positions[1].symbol).toBe('GOOGL')
    })

    it('should return empty array when account has no positions', async () => {
      server.use(
        http.get(`${BASE_URL}/v1/trading/accounts/:accountId/positions`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const positions = await client.trading.positions.list('acc-001')

      expect(positions).toEqual([])
    })
  })

  describe('error handling', () => {
    it('should throw error on 401 Unauthorized', async () => {
      const client = createBrokerClient({
        keyId: 'wrong-key',
        secretKey: 'wrong-secret',
        paper: true,
      })

      await expect(client.accounts.list()).rejects.toMatchObject({
        message: 'Unauthorized',
      })
    })

    it('should throw error on 404 Not Found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.accounts.get('non-existent')).rejects.toMatchObject({
        message: 'Account not found',
      })
    })

    it('should throw error on 500 Internal Server Error', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
        maxRetries: 0, // Disable retries for this test
      })

      await expect(client.accounts.get('error-account')).rejects.toMatchObject({
        message: 'Internal server error',
      })
    })

    it('should throw error with proper message from API response', async () => {
      server.use(
        http.post(`${BASE_URL}/v1/accounts`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json(
            {
              code: 42200001,
              message: 'Invalid request: email address is required',
            },
            { status: 422 }
          )
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(
        client.accounts.create({} as Parameters<typeof client.accounts.create>[0])
      ).rejects.toMatchObject({
        message: 'Invalid request: email address is required',
      })
    })

    it('should throw error on network failure', async () => {
      server.use(
        http.get(`${BASE_URL}/v1/accounts`, () => {
          return HttpResponse.error()
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
        maxRetries: 0, // Disable retries
      })

      await expect(client.accounts.list()).rejects.toThrow()
    })
  })

  describe('configuration options', () => {
    it('should use sandbox URL when paper is true', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      // The test will pass because our MSW server is listening on sandbox URL
      const accounts = await client.accounts.list()
      expect(accounts).toEqual(mockAccountsList)
    })

    it('should allow custom baseUrl override', async () => {
      // Use a custom base URL that points to our mock server
      const CUSTOM_URL = 'https://custom-broker.example.com'

      server.use(
        http.get(`${CUSTOM_URL}/v1/accounts`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([{ id: 'custom-acc-001' }])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        baseUrl: CUSTOM_URL,
      })

      const accounts = await client.accounts.list()
      expect(accounts).toEqual([{ id: 'custom-acc-001' }])
    })
  })

  // --------------------------------------------------------------------------
  // Additional Tests for Uncovered Methods
  // --------------------------------------------------------------------------

  describe('accounts.update()', () => {
    it('should update account contact information', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const updates = {
        contact: {
          email_address: 'updated@example.com',
          phone_number: '+15559999999',
        },
      }

      const account = await client.accounts.update(
        'acc-001',
        updates as Parameters<typeof client.accounts.update>[1]
      )

      expect(account).toBeDefined()
      expect(account.id).toBe('acc-001')
      expect(account.contact.email_address).toBe('updated@example.com')
    })

    it('should throw error when account not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(
        client.accounts.update(
          'non-existent-id',
          {} as Parameters<typeof client.accounts.update>[1]
        )
      ).rejects.toMatchObject({
        message: 'Account not found',
      })
    })
  })

  describe('accounts.getTradingAccount()', () => {
    it('should return trading account details', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const tradingAccount = await client.accounts.getTradingAccount('acc-001')

      expect(tradingAccount).toBeDefined()
      expect(tradingAccount.id).toBe('acc-001')
      expect(tradingAccount.buying_power).toBe('100000.00')
      expect(tradingAccount.cash).toBe('50000.00')
      expect(tradingAccount.portfolio_value).toBe('75000.00')
      expect(tradingAccount.pattern_day_trader).toBe(false)
    })

    it('should throw error when account not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.accounts.getTradingAccount('non-existent')).rejects.toMatchObject({
        message: 'Account not found',
      })
    })
  })

  describe('activities.getByType()', () => {
    it('should return activities filtered by type', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const activities = await client.activities.getByType(
        'FILL' as Parameters<typeof client.activities.getByType>[0]
      )

      expect(Array.isArray(activities)).toBe(true)
      expect(activities).toHaveLength(1)
      expect(activities[0].activity_type).toBe('FILL')
    })

    it('should return empty array when no activities of type exist', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const activities = await client.activities.getByType(
        'ACATC' as Parameters<typeof client.activities.getByType>[0]
      )

      expect(activities).toEqual([])
    })
  })

  describe('transfers.delete()', () => {
    it('should delete/cancel a transfer successfully', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      // Should not throw
      await expect(client.transfers.delete('acc-001', 'txn-001')).resolves.toBeUndefined()
    })

    it('should throw error when transfer not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.transfers.delete('acc-001', 'non-existent')).rejects.toMatchObject({
        message: 'Transfer not found',
      })
    })
  })

  describe('achRelationships.list()', () => {
    it('should return ACH relationships for account', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const relationships = await client.achRelationships.list('acc-001')

      expect(Array.isArray(relationships)).toBe(true)
      expect(relationships).toHaveLength(2)
      expect(relationships[0].status).toBe('APPROVED')
      expect(relationships[0].bank_account_type).toBe('CHECKING')
      expect(relationships[1].bank_account_type).toBe('SAVINGS')
    })

    it('should return empty array when account has no ACH relationships', async () => {
      server.use(
        http.get(`${BASE_URL}/v1/accounts/:accountId/ach_relationships`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const relationships = await client.achRelationships.list('acc-001')

      expect(relationships).toEqual([])
    })
  })

  describe('achRelationships.create()', () => {
    it('should create an ACH relationship', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const relationshipRequest = {
        account_owner_name: 'John Doe',
        bank_account_type: 'CHECKING',
        bank_account_number: '123456789',
        bank_routing_number: '121000358',
        nickname: 'My Checking',
      }

      const relationship = await client.achRelationships.create(
        'acc-001',
        relationshipRequest as Parameters<typeof client.achRelationships.create>[1]
      )

      expect(relationship).toBeDefined()
      expect(relationship.id).toBe('ach-rel-new-001')
      expect(relationship.status).toBe('QUEUED')
      expect(relationship.account_id).toBe('acc-001')
    })
  })

  describe('achRelationships.delete()', () => {
    it('should delete an ACH relationship successfully', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(
        client.achRelationships.delete('acc-001', 'ach-rel-001')
      ).resolves.toBeUndefined()
    })

    it('should throw error when ACH relationship not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.achRelationships.delete('acc-001', 'non-existent')).rejects.toMatchObject(
        {
          message: 'ACH relationship not found',
        }
      )
    })
  })

  describe('trading.orders.get()', () => {
    it('should return a single order by ID', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const order = await client.trading.orders.get('acc-001', 'ord-001')

      expect(order).toBeDefined()
      expect(order.id).toBe('ord-001')
      expect(order.symbol).toBe('AAPL')
      expect(order.status).toBe('filled')
    })

    it('should throw error when order not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.trading.orders.get('acc-001', 'non-existent')).rejects.toMatchObject({
        message: 'Order not found',
      })
    })
  })

  describe('trading.orders.replace()', () => {
    it('should replace/modify an existing order', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const updates = {
        qty: '20',
        limit_price: '190.00',
        time_in_force: 'gtc',
      }

      const order = await client.trading.orders.replace(
        'acc-001',
        'ord-001',
        updates as Parameters<typeof client.trading.orders.replace>[2]
      )

      expect(order).toBeDefined()
      expect(order.id).toBe('ord-replaced-001')
      expect(order.qty).toBe('20')
      expect(order.limit_price).toBe('190.00')
      expect(order.status).toBe('pending_replace')
    })

    it('should throw error when order not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(
        client.trading.orders.replace(
          'acc-001',
          'non-existent',
          {} as Parameters<typeof client.trading.orders.replace>[2]
        )
      ).rejects.toMatchObject({
        message: 'Order not found',
      })
    })
  })

  describe('trading.orders.cancel()', () => {
    it('should cancel an order successfully', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.trading.orders.cancel('acc-001', 'ord-001')).resolves.toBeUndefined()
    })

    it('should throw error when order not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.trading.orders.cancel('acc-001', 'non-existent')).rejects.toMatchObject({
        message: 'Order not found',
      })
    })
  })

  describe('trading.orders.cancelAll()', () => {
    it('should cancel all orders for account', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const result = await client.trading.orders.cancelAll('acc-001')

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ id: 'ord-001', status: 200 })
      expect(result[1]).toEqual({ id: 'ord-002', status: 200 })
    })

    it('should return empty array when no orders to cancel', async () => {
      server.use(
        http.delete(`${BASE_URL}/v1/trading/accounts/:accountId/orders`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const result = await client.trading.orders.cancelAll('acc-001')

      expect(result).toEqual([])
    })
  })

  describe('trading.positions.get()', () => {
    it('should return a single position by symbol', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const position = await client.trading.positions.get('acc-001', 'AAPL')

      expect(position).toBeDefined()
      expect(position.symbol).toBe('AAPL')
      expect(position.qty).toBe('10')
      expect(position.side).toBe('long')
    })

    it('should return a single position by asset ID', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const position = await client.trading.positions.get('acc-001', 'asset-001')

      expect(position).toBeDefined()
      expect(position.asset_id).toBe('asset-001')
      expect(position.symbol).toBe('AAPL')
    })

    it('should throw error when position not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.trading.positions.get('acc-001', 'INVALID')).rejects.toMatchObject({
        message: 'Position not found',
      })
    })
  })

  describe('trading.positions.close()', () => {
    it('should close a position by symbol', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const order = await client.trading.positions.close('acc-001', 'AAPL')

      expect(order).toBeDefined()
      expect(order.symbol).toBe('AAPL')
      expect(order.side).toBe('sell')
      expect(order.qty).toBe('10')
    })

    it('should close a position with percentage parameter', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const order = await client.trading.positions.close('acc-001', 'GOOGL', {
        percentage: '50',
      })

      expect(order).toBeDefined()
      expect(order.symbol).toBe('GOOGL')
    })

    it('should throw error when position not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.trading.positions.close('acc-001', 'INVALID')).rejects.toMatchObject({
        message: 'Position not found',
      })
    })
  })

  describe('trading.positions.closeAll()', () => {
    it('should close all positions for account', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const orders = await client.trading.positions.closeAll('acc-001')

      expect(Array.isArray(orders)).toBe(true)
      expect(orders).toHaveLength(2)
      expect(orders[0].symbol).toBe('AAPL')
      expect(orders[1].symbol).toBe('GOOGL')
    })

    it('should close all positions with cancel_orders parameter', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const orders = await client.trading.positions.closeAll('acc-001', {
        cancel_orders: true,
      })

      expect(Array.isArray(orders)).toBe(true)
    })

    it('should return empty array when no positions to close', async () => {
      server.use(
        http.delete(`${BASE_URL}/v1/trading/accounts/:accountId/positions`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const orders = await client.trading.positions.closeAll('acc-001')

      expect(orders).toEqual([])
    })
  })

  describe('documents.list()', () => {
    it('should return documents for account', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const documents = await client.documents.list('acc-001')

      expect(Array.isArray(documents)).toBe(true)
      expect(documents).toHaveLength(2)
      expect(documents[0].type).toBe('account_statement')
      expect(documents[1].type).toBe('trade_confirmation')
    })

    it('should return empty array when no documents exist', async () => {
      server.use(
        http.get(`${BASE_URL}/v1/accounts/:accountId/documents`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const documents = await client.documents.list('acc-001')

      expect(documents).toEqual([])
    })
  })

  describe('documents.download()', () => {
    it('should return download information for document', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const downloadInfo = await client.documents.download('acc-001', 'doc-001')

      expect(downloadInfo).toBeDefined()
      expect(downloadInfo.download_url).toBe('https://example.com/documents/doc-001/download')
    })

    it('should throw error when document not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.documents.download('acc-001', 'non-existent')).rejects.toMatchObject({
        message: 'Document not found',
      })
    })
  })

  describe('assets.list()', () => {
    it('should return list of assets', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const assets = await client.assets.list()

      expect(Array.isArray(assets)).toBe(true)
      expect(assets).toHaveLength(2)
      expect(assets[0].symbol).toBe('AAPL')
      expect(assets[0].name).toBe('Apple Inc.')
      expect(assets[1].symbol).toBe('GOOGL')
    })

    it('should return empty array when no assets match criteria', async () => {
      server.use(
        http.get(`${BASE_URL}/v1/assets`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const assets = await client.assets.list()

      expect(assets).toEqual([])
    })

    it('should accept query parameters for filtering', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      // Test that the method accepts params without error
      const assets = await client.assets.list({
        status: 'active',
        asset_class: 'us_equity',
      })

      expect(Array.isArray(assets)).toBe(true)
    })
  })

  describe('assets.get()', () => {
    it('should return asset by symbol', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const asset = await client.assets.get('AAPL')

      expect(asset).toBeDefined()
      expect(asset.symbol).toBe('AAPL')
      expect(asset.name).toBe('Apple Inc.')
      expect(asset.tradable).toBe(true)
      expect(asset.fractionable).toBe(true)
    })

    it('should return asset by ID', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const asset = await client.assets.get('asset-001')

      expect(asset).toBeDefined()
      expect(asset.id).toBe('asset-001')
      expect(asset.symbol).toBe('AAPL')
    })

    it('should throw error when asset not found', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      await expect(client.assets.get('INVALID')).rejects.toMatchObject({
        message: 'Asset not found',
      })
    })
  })

  describe('calendar.get()', () => {
    it('should return market calendar', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const calendar = await client.calendar.get()

      expect(Array.isArray(calendar)).toBe(true)
      expect(calendar).toHaveLength(2)
      expect(calendar[0].date).toBe('2024-01-22')
      expect(calendar[0].open).toBe('09:30')
      expect(calendar[0].close).toBe('16:00')
    })

    it('should accept date range parameters', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const calendar = await client.calendar.get({
        start: '2024-01-22',
        end: '2024-01-26',
      })

      expect(Array.isArray(calendar)).toBe(true)
    })

    it('should return empty array for dates with no market hours', async () => {
      server.use(
        http.get(`${BASE_URL}/v1/calendar`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json([])
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const calendar = await client.calendar.get()

      expect(calendar).toEqual([])
    })
  })

  describe('clock.get()', () => {
    it('should return market clock', async () => {
      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const clock = await client.clock.get()

      expect(clock).toBeDefined()
      expect(clock.timestamp).toBe('2024-01-22T14:30:00-05:00')
      expect(clock.is_open).toBe(true)
      expect(clock.next_open).toBe('2024-01-23T09:30:00-05:00')
      expect(clock.next_close).toBe('2024-01-22T16:00:00-05:00')
    })

    it('should return closed market status', async () => {
      server.use(
        http.get(`${BASE_URL}/v1/clock`, ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader !== EXPECTED_AUTH) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json({
            timestamp: '2024-01-21T20:00:00-05:00',
            is_open: false,
            next_open: '2024-01-22T09:30:00-05:00',
            next_close: '2024-01-22T16:00:00-05:00',
          })
        })
      )

      const client = createBrokerClient({
        keyId: TEST_KEY_ID,
        secretKey: TEST_SECRET_KEY,
        paper: true,
      })

      const clock = await client.clock.get()

      expect(clock.is_open).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // Branch Coverage Tests
  // --------------------------------------------------------------------------

  describe('branch coverage tests', () => {
    // Test all methods with options.signal parameter

    describe('options parameter with signal', () => {
      it('accounts.list() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const accounts = await client.accounts.list(undefined, { signal: controller.signal })

        expect(Array.isArray(accounts)).toBe(true)
      })

      it('accounts.list() should accept params with options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const accounts = await client.accounts.list(
          { query: 'test' } as Parameters<typeof client.accounts.list>[0],
          { signal: controller.signal }
        )

        expect(Array.isArray(accounts)).toBe(true)
      })

      it('accounts.get() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const account = await client.accounts.get('acc-001', { signal: controller.signal })

        expect(account.id).toBe('acc-001')
      })

      it('accounts.create() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const newAccountRequest = {
          contact: {
            email_address: 'test@example.com',
            phone_number: '+15551234567',
            street_address: ['123 Main St'],
            city: 'New York',
            state: 'NY',
            postal_code: '10001',
          },
          identity: {
            given_name: 'Test',
            family_name: 'User',
            date_of_birth: '1990-01-15',
            country_of_citizenship: 'USA',
            country_of_birth: 'USA',
            country_of_tax_residence: 'USA',
            funding_source: ['employment_income'],
          },
          disclosures: {
            is_control_person: false,
            is_affiliated_exchange_or_finra: false,
            is_politically_exposed: false,
            immediate_family_exposed: false,
          },
          agreements: [
            {
              agreement: 'customer_agreement',
              signed_at: '2024-01-20T10:00:00Z',
              ip_address: '192.168.1.1',
            },
          ],
        }
        const account = await client.accounts.create(
          newAccountRequest as Parameters<typeof client.accounts.create>[0],
          { signal: controller.signal }
        )

        expect(account.id).toBe('acc-new-001')
      })

      it('accounts.update() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const account = await client.accounts.update(
          'acc-001',
          { contact: { email_address: 'updated@example.com' } } as Parameters<
            typeof client.accounts.update
          >[1],
          { signal: controller.signal }
        )

        expect(account.id).toBe('acc-001')
      })

      it('accounts.getTradingAccount() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const tradingAccount = await client.accounts.getTradingAccount('acc-001', {
          signal: controller.signal,
        })

        expect(tradingAccount.id).toBe('acc-001')
      })

      it('activities.list() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const activities = await client.activities.list(undefined, { signal: controller.signal })

        expect(Array.isArray(activities)).toBe(true)
      })

      it('activities.list() should accept params with options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const activities = await client.activities.list(
          { page_size: 10 } as Parameters<typeof client.activities.list>[0],
          { signal: controller.signal }
        )

        expect(Array.isArray(activities)).toBe(true)
      })

      it('activities.getByType() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const activities = await client.activities.getByType(
          'FILL' as Parameters<typeof client.activities.getByType>[0],
          undefined,
          { signal: controller.signal }
        )

        expect(Array.isArray(activities)).toBe(true)
      })

      it('activities.getByType() should accept params with options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const activities = await client.activities.getByType(
          'FILL' as Parameters<typeof client.activities.getByType>[0],
          { page_size: 10 } as Parameters<typeof client.activities.getByType>[1],
          { signal: controller.signal }
        )

        expect(Array.isArray(activities)).toBe(true)
      })

      it('transfers.list() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const transfers = await client.transfers.list('acc-001', undefined, {
          signal: controller.signal,
        })

        expect(Array.isArray(transfers)).toBe(true)
      })

      it('transfers.list() should accept params with options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const transfers = await client.transfers.list(
          'acc-001',
          { direction: 'INCOMING' } as Parameters<typeof client.transfers.list>[1],
          { signal: controller.signal }
        )

        expect(Array.isArray(transfers)).toBe(true)
      })

      it('transfers.create() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const transferRequest = {
          transfer_type: 'ach',
          direction: 'INCOMING',
          amount: '1000.00',
          relationship_id: 'ach-rel-001',
        }
        const transfer = await client.transfers.create(
          'acc-001',
          transferRequest as Parameters<typeof client.transfers.create>[1],
          { signal: controller.signal }
        )

        expect(transfer.id).toBe('txn-new-001')
      })

      it('transfers.delete() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        await expect(
          client.transfers.delete('acc-001', 'txn-001', { signal: controller.signal })
        ).resolves.toBeUndefined()
      })

      it('achRelationships.list() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const relationships = await client.achRelationships.list('acc-001', {
          signal: controller.signal,
        })

        expect(Array.isArray(relationships)).toBe(true)
      })

      it('achRelationships.create() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const relationshipRequest = {
          account_owner_name: 'John Doe',
          bank_account_type: 'CHECKING',
          bank_account_number: '123456789',
          bank_routing_number: '121000358',
          nickname: 'My Checking',
        }
        const relationship = await client.achRelationships.create(
          'acc-001',
          relationshipRequest as Parameters<typeof client.achRelationships.create>[1],
          { signal: controller.signal }
        )

        expect(relationship.id).toBe('ach-rel-new-001')
      })

      it('achRelationships.delete() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        await expect(
          client.achRelationships.delete('acc-001', 'ach-rel-001', { signal: controller.signal })
        ).resolves.toBeUndefined()
      })

      it('trading.orders.list() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const orders = await client.trading.orders.list('acc-001', undefined, {
          signal: controller.signal,
        })

        expect(Array.isArray(orders)).toBe(true)
      })

      it('trading.orders.list() should accept params with options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const orders = await client.trading.orders.list(
          'acc-001',
          { status: 'open' } as Parameters<typeof client.trading.orders.list>[1],
          { signal: controller.signal }
        )

        expect(Array.isArray(orders)).toBe(true)
      })

      it('trading.orders.get() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const order = await client.trading.orders.get('acc-001', 'ord-001', {
          signal: controller.signal,
        })

        expect(order.id).toBe('ord-001')
      })

      it('trading.orders.create() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const orderRequest = {
          symbol: 'AAPL',
          qty: '10',
          side: 'buy',
          type: 'market',
          time_in_force: 'day',
        }
        const order = await client.trading.orders.create(
          'acc-001',
          orderRequest as Parameters<typeof client.trading.orders.create>[1],
          { signal: controller.signal }
        )

        expect(order.id).toBe('ord-new-001')
      })

      it('trading.orders.replace() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const order = await client.trading.orders.replace(
          'acc-001',
          'ord-001',
          { qty: '20' } as Parameters<typeof client.trading.orders.replace>[2],
          { signal: controller.signal }
        )

        expect(order.id).toBe('ord-replaced-001')
      })

      it('trading.orders.cancel() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        await expect(
          client.trading.orders.cancel('acc-001', 'ord-001', { signal: controller.signal })
        ).resolves.toBeUndefined()
      })

      it('trading.orders.cancelAll() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const result = await client.trading.orders.cancelAll('acc-001', {
          signal: controller.signal,
        })

        expect(Array.isArray(result)).toBe(true)
      })

      it('trading.positions.list() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const positions = await client.trading.positions.list('acc-001', {
          signal: controller.signal,
        })

        expect(Array.isArray(positions)).toBe(true)
      })

      it('trading.positions.get() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const position = await client.trading.positions.get('acc-001', 'AAPL', {
          signal: controller.signal,
        })

        expect(position.symbol).toBe('AAPL')
      })

      it('trading.positions.close() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const order = await client.trading.positions.close('acc-001', 'AAPL', undefined, {
          signal: controller.signal,
        })

        expect(order.symbol).toBe('AAPL')
      })

      it('trading.positions.close() should accept params with options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const order = await client.trading.positions.close(
          'acc-001',
          'GOOGL',
          { percentage: '50' },
          { signal: controller.signal }
        )

        expect(order.symbol).toBe('GOOGL')
      })

      it('trading.positions.closeAll() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const orders = await client.trading.positions.closeAll('acc-001', undefined, {
          signal: controller.signal,
        })

        expect(Array.isArray(orders)).toBe(true)
      })

      it('trading.positions.closeAll() should accept params with options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const orders = await client.trading.positions.closeAll(
          'acc-001',
          { cancel_orders: true },
          { signal: controller.signal }
        )

        expect(Array.isArray(orders)).toBe(true)
      })

      it('documents.list() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const documents = await client.documents.list('acc-001', undefined, {
          signal: controller.signal,
        })

        expect(Array.isArray(documents)).toBe(true)
      })

      it('documents.list() should accept params with options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const documents = await client.documents.list(
          'acc-001',
          { type: 'account_statement' } as Parameters<typeof client.documents.list>[1],
          { signal: controller.signal }
        )

        expect(Array.isArray(documents)).toBe(true)
      })

      it('documents.download() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const downloadInfo = await client.documents.download('acc-001', 'doc-001', {
          signal: controller.signal,
        })

        expect(downloadInfo.download_url).toBeDefined()
      })

      it('assets.list() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const assets = await client.assets.list(undefined, { signal: controller.signal })

        expect(Array.isArray(assets)).toBe(true)
      })

      it('assets.list() should accept params with options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const assets = await client.assets.list(
          { status: 'active', asset_class: 'us_equity' },
          { signal: controller.signal }
        )

        expect(Array.isArray(assets)).toBe(true)
      })

      it('assets.get() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const asset = await client.assets.get('AAPL', { signal: controller.signal })

        expect(asset.symbol).toBe('AAPL')
      })

      it('calendar.get() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const calendar = await client.calendar.get(undefined, { signal: controller.signal })

        expect(Array.isArray(calendar)).toBe(true)
      })

      it('calendar.get() should accept params with options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const calendar = await client.calendar.get(
          { start: '2024-01-22', end: '2024-01-26' },
          { signal: controller.signal }
        )

        expect(Array.isArray(calendar)).toBe(true)
      })

      it('clock.get() should accept options with signal', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })
        const controller = new AbortController()
        const clock = await client.clock.get({ signal: controller.signal })

        expect(clock.is_open).toBeDefined()
      })
    })

    // Test null data responses (data ?? [] branches)

    describe('null response handling', () => {
      it('accounts.list() handles null response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/accounts`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const accounts = await client.accounts.list()

        expect(accounts).toEqual([])
      })

      it('activities.list() handles null response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/accounts/activities`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const activities = await client.activities.list()

        expect(activities).toEqual([])
      })

      it('activities.getByType() handles null response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/accounts/activities/:activityType`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const activities = await client.activities.getByType(
          'FILL' as Parameters<typeof client.activities.getByType>[0]
        )

        expect(activities).toEqual([])
      })

      it('transfers.list() handles null response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/accounts/:accountId/transfers`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const transfers = await client.transfers.list('acc-001')

        expect(transfers).toEqual([])
      })

      it('achRelationships.list() handles null response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/accounts/:accountId/ach_relationships`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const relationships = await client.achRelationships.list('acc-001')

        expect(relationships).toEqual([])
      })

      it('trading.orders.list() handles null response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/trading/accounts/:accountId/orders`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const orders = await client.trading.orders.list('acc-001')

        expect(orders).toEqual([])
      })

      it('trading.orders.cancelAll() handles null response', async () => {
        server.use(
          http.delete(`${BASE_URL}/v1/trading/accounts/:accountId/orders`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const result = await client.trading.orders.cancelAll('acc-001')

        expect(result).toEqual([])
      })

      it('trading.positions.list() handles null response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/trading/accounts/:accountId/positions`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const positions = await client.trading.positions.list('acc-001')

        expect(positions).toEqual([])
      })

      it('trading.positions.closeAll() handles null response', async () => {
        server.use(
          http.delete(`${BASE_URL}/v1/trading/accounts/:accountId/positions`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const orders = await client.trading.positions.closeAll('acc-001')

        expect(orders).toEqual([])
      })

      it('documents.list() handles null response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/accounts/:accountId/documents`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const documents = await client.documents.list('acc-001')

        expect(documents).toEqual([])
      })

      it('assets.list() handles null response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/assets`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const assets = await client.assets.list()

        expect(assets).toEqual([])
      })

      it('calendar.get() handles null response', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/calendar`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(null)
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const calendar = await client.calendar.get()

        expect(calendar).toEqual([])
      })
    })

    // Test methods without optional params

    describe('methods called without optional params', () => {
      it('accounts.list() without params', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const accounts = await client.accounts.list()

        expect(Array.isArray(accounts)).toBe(true)
      })

      it('activities.list() without params', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const activities = await client.activities.list()

        expect(Array.isArray(activities)).toBe(true)
      })

      it('activities.getByType() without optional params', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const activities = await client.activities.getByType(
          'FILL' as Parameters<typeof client.activities.getByType>[0]
        )

        expect(Array.isArray(activities)).toBe(true)
      })

      it('transfers.list() without params', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const transfers = await client.transfers.list('acc-001')

        expect(Array.isArray(transfers)).toBe(true)
      })

      it('trading.orders.list() without params', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const orders = await client.trading.orders.list('acc-001')

        expect(Array.isArray(orders)).toBe(true)
      })

      it('trading.positions.close() without optional params', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const order = await client.trading.positions.close('acc-001', 'AAPL')

        expect(order.symbol).toBe('AAPL')
      })

      it('trading.positions.closeAll() without params', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const orders = await client.trading.positions.closeAll('acc-001')

        expect(Array.isArray(orders)).toBe(true)
      })

      it('documents.list() without params', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const documents = await client.documents.list('acc-001')

        expect(Array.isArray(documents)).toBe(true)
      })

      it('assets.list() without params', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const assets = await client.assets.list()

        expect(Array.isArray(assets)).toBe(true)
      })

      it('calendar.get() without params', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const calendar = await client.calendar.get()

        expect(Array.isArray(calendar)).toBe(true)
      })

      it('clock.get() without options', async () => {
        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
        })

        const clock = await client.clock.get()

        expect(clock.is_open).toBeDefined()
      })
    })

    // Test error throwing for methods with data ?? [] pattern

    describe('error handling for methods with data ?? [] pattern', () => {
      it('activities.list() should throw error on API error', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/accounts/activities`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(client.activities.list()).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('activities.getByType() should throw error on API error', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/accounts/activities/:activityType`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(
          client.activities.getByType('FILL' as Parameters<typeof client.activities.getByType>[0])
        ).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('transfers.list() should throw error on API error', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/accounts/:accountId/transfers`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(client.transfers.list('acc-001')).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('achRelationships.list() should throw error on API error', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/accounts/:accountId/ach_relationships`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(client.achRelationships.list('acc-001')).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('trading.orders.list() should throw error on API error', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/trading/accounts/:accountId/orders`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(client.trading.orders.list('acc-001')).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('trading.orders.cancelAll() should throw error on API error', async () => {
        server.use(
          http.delete(`${BASE_URL}/v1/trading/accounts/:accountId/orders`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(client.trading.orders.cancelAll('acc-001')).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('trading.positions.list() should throw error on API error', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/trading/accounts/:accountId/positions`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(client.trading.positions.list('acc-001')).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('trading.positions.closeAll() should throw error on API error', async () => {
        server.use(
          http.delete(`${BASE_URL}/v1/trading/accounts/:accountId/positions`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(client.trading.positions.closeAll('acc-001')).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('documents.list() should throw error on API error', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/accounts/:accountId/documents`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(client.documents.list('acc-001')).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('assets.list() should throw error on API error', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/assets`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(client.assets.list()).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('calendar.get() should throw error on API error', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/calendar`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(client.calendar.get()).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('clock.get() should throw error on API error', async () => {
        server.use(
          http.get(`${BASE_URL}/v1/clock`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        await expect(client.clock.get()).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('transfers.create() should throw error on API error', async () => {
        server.use(
          http.post(`${BASE_URL}/v1/accounts/:accountId/transfers`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        const transferRequest = {
          transfer_type: 'ach',
          direction: 'INCOMING',
          amount: '1000.00',
          relationship_id: 'ach-rel-001',
        }

        await expect(
          client.transfers.create(
            'acc-001',
            transferRequest as Parameters<typeof client.transfers.create>[1]
          )
        ).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('achRelationships.create() should throw error on API error', async () => {
        server.use(
          http.post(`${BASE_URL}/v1/accounts/:accountId/ach_relationships`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        const relationshipRequest = {
          account_owner_name: 'John Doe',
          bank_account_type: 'CHECKING',
          bank_account_number: '123456789',
          bank_routing_number: '121000358',
          nickname: 'My Checking',
        }

        await expect(
          client.achRelationships.create(
            'acc-001',
            relationshipRequest as Parameters<typeof client.achRelationships.create>[1]
          )
        ).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })

      it('trading.orders.create() should throw error on API error', async () => {
        server.use(
          http.post(`${BASE_URL}/v1/trading/accounts/:accountId/orders`, ({ request }) => {
            const authHeader = request.headers.get('Authorization')
            if (authHeader !== EXPECTED_AUTH) {
              return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
            return HttpResponse.json(
              { code: 50000000, message: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        const client = createBrokerClient({
          keyId: TEST_KEY_ID,
          secretKey: TEST_SECRET_KEY,
          paper: true,
          maxRetries: 0,
        })

        const orderRequest = {
          symbol: 'AAPL',
          qty: '10',
          side: 'buy',
          type: 'market',
          time_in_force: 'day',
        }

        await expect(
          client.trading.orders.create(
            'acc-001',
            orderRequest as Parameters<typeof client.trading.orders.create>[1]
          )
        ).rejects.toMatchObject({
          message: 'Internal server error',
        })
      })
    })
  })
})
