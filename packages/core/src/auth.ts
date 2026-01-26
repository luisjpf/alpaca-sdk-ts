/**
 * Authentication strategies for Alpaca APIs
 */

/** Authentication headers for Trading/Market Data APIs */
export type ApiKeyAuth = {
  'APCA-API-KEY-ID': string
  'APCA-API-SECRET-KEY': string
} & Record<string, string>

/** Authentication header for Broker API (HTTP Basic) */
export type BasicAuth = {
  Authorization: string
} & Record<string, string>

/** Authentication header for OAuth */
export type OAuthAuth = {
  Authorization: string
} & Record<string, string>

export type AuthHeaders = ApiKeyAuth | BasicAuth | OAuthAuth

/**
 * Create API Key authentication headers
 */
export function createApiKeyAuth(keyId: string, secretKey: string): ApiKeyAuth {
  return {
    'APCA-API-KEY-ID': keyId,
    'APCA-API-SECRET-KEY': secretKey,
  }
}

/**
 * Create HTTP Basic authentication header for Broker API
 */
export function createBasicAuth(keyId: string, secretKey: string): BasicAuth {
  const credentials = btoa(`${keyId}:${secretKey}`)
  return {
    Authorization: `Basic ${credentials}`,
  }
}

/**
 * Create OAuth Bearer token header
 */
export function createOAuthAuth(token: string): OAuthAuth {
  return {
    Authorization: `Bearer ${token}`,
  }
}

/**
 * WebSocket authentication message
 */
export interface WebSocketAuthMessage {
  action: 'auth'
  key: string
  secret: string
}

/**
 * Create WebSocket authentication message
 */
export function createWebSocketAuth(keyId: string, secretKey: string): WebSocketAuthMessage {
  return {
    action: 'auth',
    key: keyId,
    secret: secretKey,
  }
}

/**
 * Create WebSocket OAuth authentication message
 */
export function createWebSocketOAuth(token: string): WebSocketAuthMessage {
  return {
    action: 'auth',
    key: 'oauth',
    secret: token,
  }
}
