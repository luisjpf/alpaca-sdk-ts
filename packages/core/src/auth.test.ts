/**
 * Unit tests for authentication functions
 */

import { describe, it, expect } from 'vitest'
import {
  createApiKeyAuth,
  createBasicAuth,
  createOAuthAuth,
  createWebSocketAuth,
  createWebSocketOAuth,
} from './auth'

describe('auth', () => {
  describe('createApiKeyAuth', () => {
    it('should return correct headers with APCA-API-KEY-ID and APCA-API-SECRET-KEY', () => {
      const keyId = 'test-key-id'
      const secretKey = 'test-secret-key'

      const result = createApiKeyAuth(keyId, secretKey)

      expect(result).toEqual({
        'APCA-API-KEY-ID': 'test-key-id',
        'APCA-API-SECRET-KEY': 'test-secret-key',
      })
    })

    it('should throw error for empty keyId', () => {
      expect(() => createApiKeyAuth('', 'secret')).toThrow('API Key ID cannot be empty')
    })

    it('should throw error for empty secretKey', () => {
      expect(() => createApiKeyAuth('valid-key', '')).toThrow('Secret Key cannot be empty')
    })

    it('should throw error for whitespace-only keyId', () => {
      expect(() => createApiKeyAuth('   ', 'secret')).toThrow('API Key ID cannot be empty')
    })

    it('should throw error for whitespace-only secretKey', () => {
      expect(() => createApiKeyAuth('valid-key', '  ')).toThrow('Secret Key cannot be empty')
    })

    it('should handle special characters in credentials', () => {
      const keyId = 'key-with-special-chars-!@#$%'
      const secretKey = 'secret-with-special-chars-^&*()'

      const result = createApiKeyAuth(keyId, secretKey)

      expect(result['APCA-API-KEY-ID']).toBe(keyId)
      expect(result['APCA-API-SECRET-KEY']).toBe(secretKey)
    })
  })

  describe('createBasicAuth', () => {
    it('should create proper base64 encoded Authorization header', () => {
      const keyId = 'test-key'
      const secretKey = 'test-secret'

      const result = createBasicAuth(keyId, secretKey)

      // Base64 encode "test-key:test-secret" = "dGVzdC1rZXk6dGVzdC1zZWNyZXQ="
      const expectedCredentials = btoa(`${keyId}:${secretKey}`)
      expect(result).toEqual({
        Authorization: `Basic ${expectedCredentials}`,
      })
    })

    it('should correctly encode credentials with special characters', () => {
      const keyId = 'user@domain.com'
      const secretKey = 'pass:word!'

      const result = createBasicAuth(keyId, secretKey)

      const expectedCredentials = btoa(`${keyId}:${secretKey}`)
      expect(result.Authorization).toBe(`Basic ${expectedCredentials}`)
    })

    it('should have Authorization header starting with "Basic "', () => {
      const result = createBasicAuth('key', 'secret')

      expect(result.Authorization).toMatch(/^Basic /)
    })

    it('should produce decodable base64 credentials', () => {
      const keyId = 'my-key'
      const secretKey = 'my-secret'

      const result = createBasicAuth(keyId, secretKey)

      const base64Part = result.Authorization.replace('Basic ', '')
      const decoded = atob(base64Part)
      expect(decoded).toBe(`${keyId}:${secretKey}`)
    })
  })

  describe('createOAuthAuth', () => {
    it('should create Bearer token header', () => {
      const token = 'oauth-access-token-123'

      const result = createOAuthAuth(token)

      expect(result).toEqual({
        Authorization: 'Bearer oauth-access-token-123',
      })
    })

    it('should handle JWT-like tokens', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'

      const result = createOAuthAuth(token)

      expect(result.Authorization).toBe(`Bearer ${token}`)
    })

    it('should have Authorization header starting with "Bearer "', () => {
      const result = createOAuthAuth('token')

      expect(result.Authorization).toMatch(/^Bearer /)
    })

    it('should throw error for empty token', () => {
      expect(() => createOAuthAuth('')).toThrow('OAuth token cannot be empty')
    })

    it('should throw error for whitespace-only token', () => {
      expect(() => createOAuthAuth('   ')).toThrow('OAuth token cannot be empty')
    })
  })

  describe('createWebSocketAuth', () => {
    it('should return proper auth message with action, key, and secret', () => {
      const keyId = 'ws-key-id'
      const secretKey = 'ws-secret-key'

      const result = createWebSocketAuth(keyId, secretKey)

      expect(result).toEqual({
        action: 'auth',
        key: 'ws-key-id',
        secret: 'ws-secret-key',
      })
    })

    it('should have action property set to "auth"', () => {
      const result = createWebSocketAuth('key', 'secret')

      expect(result.action).toBe('auth')
    })

    it('should map keyId to key property', () => {
      const keyId = 'my-api-key'

      const result = createWebSocketAuth(keyId, 'secret')

      expect(result.key).toBe(keyId)
    })

    it('should map secretKey to secret property', () => {
      const secretKey = 'my-secret-key'

      const result = createWebSocketAuth('key', secretKey)

      expect(result.secret).toBe(secretKey)
    })
  })

  describe('createWebSocketOAuth', () => {
    it('should return proper OAuth auth message', () => {
      const token = 'oauth-token-456'

      const result = createWebSocketOAuth(token)

      expect(result).toEqual({
        action: 'auth',
        key: 'oauth',
        secret: 'oauth-token-456',
      })
    })

    it('should have action property set to "auth"', () => {
      const result = createWebSocketOAuth('token')

      expect(result.action).toBe('auth')
    })

    it('should have key property set to "oauth"', () => {
      const result = createWebSocketOAuth('any-token')

      expect(result.key).toBe('oauth')
    })

    it('should map token to secret property', () => {
      const token = 'my-oauth-token'

      const result = createWebSocketOAuth(token)

      expect(result.secret).toBe(token)
    })

    it('should handle JWT tokens', () => {
      const jwtToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature'

      const result = createWebSocketOAuth(jwtToken)

      expect(result.secret).toBe(jwtToken)
      expect(result.key).toBe('oauth')
    })
  })
})
