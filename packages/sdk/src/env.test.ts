import { describe, it, expect, beforeEach } from 'vitest'
import { validateDeploymentConfig, validateGatewayConfig } from './env'
import type { EnvConfig } from './env'

describe('Environment Validation', () => {
  const validConfig: EnvConfig = {
    suiPrivateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    ethPrivateKey: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    suiRpcUrl: 'https://fullnode.testnet.sui.io:443',
    ethRpcUrl: 'https://eth.llamarpc.com',
    walrusPublisherUrl: 'https://publisher.walrus-testnet.walrus.space',
    walrusAggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    gatewayDomain: 'walrus.tools'
  }

  describe('validateDeploymentConfig', () => {
    it('should pass with valid configuration', () => {
      const result = validateDeploymentConfig(validConfig)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail with missing private keys', () => {
      const config = { ...validConfig, suiPrivateKey: undefined, ethPrivateKey: undefined }
      const result = validateDeploymentConfig(config)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('SUI_PRIVATE_KEY is required')
      expect(result.errors).toContain('ETH_PRIVATE_KEY is required')
    })

    it('should fail with invalid private key format', () => {
      const config = { 
        ...validConfig, 
        suiPrivateKey: 'invalid-key',
        ethPrivateKey: '0x123' // too short
      }
      const result = validateDeploymentConfig(config)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('SUI_PRIVATE_KEY'))).toBe(true)
      expect(result.errors.some(e => e.includes('ETH_PRIVATE_KEY'))).toBe(true)
    })

    it('should fail with invalid URLs', () => {
      const config = { 
        ...validConfig, 
        suiRpcUrl: 'not-a-url',
        walrusPublisherUrl: 'ftp://invalid-protocol.com'
      }
      const result = validateDeploymentConfig(config)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('SUI_RPC_URL'))).toBe(true)
      expect(result.errors.some(e => e.includes('WALRUS_PUBLISHER_URL'))).toBe(true)
    })

    it('should generate warnings for testnet usage', () => {
      const result = validateDeploymentConfig(validConfig)
      
      expect(result.warnings.some(w => w.includes('testnet'))).toBe(true)
    })
  })

  describe('validateGatewayConfig', () => {
    it('should pass with valid gateway configuration', () => {
      const result = validateGatewayConfig(validConfig)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should not require private keys for gateway', () => {
      const config = { 
        ...validConfig, 
        suiPrivateKey: undefined, 
        ethPrivateKey: undefined 
      }
      const result = validateGatewayConfig(config)
      
      expect(result.isValid).toBe(true)
    })

    it('should fail with missing gateway domain', () => {
      const config = { ...validConfig, gatewayDomain: undefined }
      const result = validateGatewayConfig(config)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('GATEWAY_DOMAIN is required')
    })
  })

  describe('Private Key Validation', () => {
    it('should accept valid hex private keys', () => {
      const validKeys = [
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        '0xabcdefABCDEF1234567890abcdef1234567890abcdef1234567890abcdef12'
      ]

      validKeys.forEach(key => {
        const config = { ...validConfig, suiPrivateKey: key }
        const result = validateDeploymentConfig(config)
        
        expect(result.errors.some(e => e.includes('SUI_PRIVATE_KEY'))).toBe(false)
      })
    })

    it('should reject invalid private keys', () => {
      const invalidKeys = [
        'no-0x-prefix',
        '0x123', // too short
        '0x' + 'z'.repeat(64), // invalid hex characters
        '0x' + '1'.repeat(63), // one character short
        '0x' + '1'.repeat(65), // one character long
      ]

      invalidKeys.forEach(key => {
        const config = { ...validConfig, suiPrivateKey: key }
        const result = validateDeploymentConfig(config)
        
        expect(result.errors.some(e => e.includes('SUI_PRIVATE_KEY'))).toBe(true)
      })
    })
  })
})