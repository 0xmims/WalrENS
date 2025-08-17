import { vi } from 'vitest'

// Mock environment for tests
Object.defineProperty(global, 'process', {
  value: {
    ...process,
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  }
})

// Mock DOM APIs for Node.js environment
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Mock fetch API
global.fetch = vi.fn()

// Mock FormData
global.FormData = vi.fn(() => ({
  append: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn()
})) as any

// Mock Blob
global.Blob = vi.fn((content: any[], options?: any) => ({
  content,
  options,
  size: content.reduce((acc, item) => acc + (item?.length || 0), 0),
  type: options?.type || ''
})) as any