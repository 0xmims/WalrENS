import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  saveDeployedSite, 
  getDeployedSites, 
  removeDeployedSite, 
  getDeployedSiteByEns,
  clearDeployedSites 
} from './storage'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('Storage Utilities', () => {
  beforeEach(() => {
    clearDeployedSites()
  })

  it('should save and retrieve deployed sites', () => {
    const site = saveDeployedSite({
      ensName: 'test.eth',
      objectId: '0x123',
      transactionHash: '0xabc',
      filesCount: 5,
      template: 'portfolio',
      status: 'active' as const,
      gatewayUrl: 'https://test.eth.walrus.tools'
    })

    expect(site.id).toBeDefined()
    expect(site.ensName).toBe('test.eth')
    expect(site.deployedAt).toBeInstanceOf(Date)

    const sites = getDeployedSites()
    expect(sites).toHaveLength(1)
    expect(sites[0]).toEqual(site)
  })

  it('should find site by ENS name', () => {
    const site = saveDeployedSite({
      ensName: 'test.eth',
      objectId: '0x123',
      transactionHash: '0xabc',
      filesCount: 5,
      status: 'active' as const,
      gatewayUrl: 'https://test.eth.walrus.tools'
    })

    const found = getDeployedSiteByEns('test.eth')
    expect(found).toEqual(site)

    const notFound = getDeployedSiteByEns('nonexistent.eth')
    expect(notFound).toBeNull()
  })

  it('should remove deployed sites', () => {
    const site = saveDeployedSite({
      ensName: 'test.eth',
      objectId: '0x123',
      transactionHash: '0xabc',
      filesCount: 5,
      status: 'active' as const,
      gatewayUrl: 'https://test.eth.walrus.tools'
    })

    expect(getDeployedSites()).toHaveLength(1)

    const removed = removeDeployedSite(site.id)
    expect(removed).toBe(true)
    expect(getDeployedSites()).toHaveLength(0)

    const notRemoved = removeDeployedSite('nonexistent')
    expect(notRemoved).toBe(false)
  })

  it('should replace existing site with same ENS name', () => {
    // Save first site
    saveDeployedSite({
      ensName: 'test.eth',
      objectId: '0x123',
      transactionHash: '0xabc',
      filesCount: 5,
      status: 'active' as const,
      gatewayUrl: 'https://test.eth.walrus.tools'
    })

    // Save second site with same ENS name
    const site2 = saveDeployedSite({
      ensName: 'test.eth',
      objectId: '0x456',
      transactionHash: '0xdef',
      filesCount: 10,
      status: 'active' as const,
      gatewayUrl: 'https://test.eth.walrus.tools'
    })

    const sites = getDeployedSites()
    expect(sites).toHaveLength(1)
    expect(sites[0].objectId).toBe('0x456')
    expect(sites[0]).toEqual(site2)
  })

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage.setItem to throw an error
    const originalSetItem = localStorage.setItem
    localStorage.setItem = () => {
      throw new Error('Storage quota exceeded')
    }

    expect(() => {
      saveDeployedSite({
        ensName: 'test.eth',
        objectId: '0x123',
        transactionHash: '0xabc',
        filesCount: 5,
        status: 'active' as const,
        gatewayUrl: 'https://test.eth.walrus.tools'
      })
    }).toThrow('Failed to save site information')

    // Restore original function
    localStorage.setItem = originalSetItem
  })
})