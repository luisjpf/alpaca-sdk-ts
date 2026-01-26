/**
 * Authentication strategies for Alpaca APIs
 */

/**
 * Validates that a credential string is non-empty
 * @throws Error if the credential is empty or whitespace-only
 */
function validateCredential(value: string, name: string): void {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} cannot be empty`)
  }
}

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
 * @throws Error if keyId or secretKey is empty
 */
export function createApiKeyAuth(keyId: string, secretKey: string): ApiKeyAuth {
  validateCredential(keyId, 'API Key ID')
  validateCredential(secretKey, 'Secret Key')
  return {
    'APCA-API-KEY-ID': keyId,
    'APCA-API-SECRET-KEY': secretKey,
  }
}

/**
 * Create HTTP Basic authentication header for Broker API
 * @throws Error if keyId or secretKey is empty
 */
export function createBasicAuth(keyId: string, secretKey: string): BasicAuth {
  validateCredential(keyId, 'API Key ID')
  validateCredential(secretKey, 'Secret Key')
  const credentials = btoa(`${keyId}:${secretKey}`)
  return {
    Authorization: `Basic ${credentials}`,
  }
}

/**
 * Create OAuth Bearer token header
 * @throws Error if token is empty
 */
export function createOAuthAuth(token: string): OAuthAuth {
  validateCredential(token, 'OAuth token')
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
 * @throws Error if keyId or secretKey is empty
 */
export function createWebSocketAuth(keyId: string, secretKey: string): WebSocketAuthMessage {
  validateCredential(keyId, 'API Key ID')
  validateCredential(secretKey, 'Secret Key')
  return {
    action: 'auth',
    key: keyId,
    secret: secretKey,
  }
}

/**
 * Create WebSocket OAuth authentication message
 * @throws Error if token is empty
 */
export function createWebSocketOAuth(token: string): WebSocketAuthMessage {
  validateCredential(token, 'OAuth token')
  return {
    action: 'auth',
    key: 'oauth',
    secret: token,
  }
}
