import { describe, it, expect } from 'vitest'
import { parseWalrusText, stringifyWalrusMapping } from './ens'
import type { WalrusMapping } from './index'

describe('ENS Walrus Text Parsing', () => {
  it('should parse blob mapping correctly', () => {
    const text = 'blob:0x123456789abcdef'
    const result = parseWalrusText(text)
    
    expect(result).toEqual({
      type: 'blob',
      id: '0x123456789abcdef'
    })
  })

  it('should parse site mapping correctly', () => {
    const text = JSON.stringify({
      type: 'site',
      id: '0x987654321fedcba',
      index: 'index.html'
    })
    
    const result = parseWalrusText(text)
    
    expect(result).toEqual({
      type: 'site',
      id: '0x987654321fedcba',
      index: 'index.html'
    })
  })

  it('should return null for invalid JSON', () => {
    const text = 'invalid json {'
    const result = parseWalrusText(text)
    
    expect(result).toBeNull()
  })

  it('should return null for missing required fields', () => {
    const text = JSON.stringify({
      type: 'site'
      // missing id
    })
    
    const result = parseWalrusText(text)
    
    expect(result).toBeNull()
  })

  it('should stringify blob mapping correctly', () => {
    const mapping: WalrusMapping = {
      type: 'blob',
      id: '0x123456789abcdef'
    }
    
    const result = stringifyWalrusMapping(mapping)
    
    expect(result).toBe('blob:0x123456789abcdef')
  })

  it('should stringify site mapping correctly', () => {
    const mapping: WalrusMapping = {
      type: 'site',
      id: '0x987654321fedcba',
      index: 'index.html'
    }
    
    const result = stringifyWalrusMapping(mapping)
    
    expect(result).toBe(JSON.stringify(mapping))
  })
})