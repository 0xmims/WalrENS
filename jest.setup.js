// Jest setup file for global test configuration

// Mock environment variables for tests
process.env.NODE_ENV = 'test'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error and warn for important test diagnostics
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
}

// Mock window.prompt for tests
global.prompt = jest.fn()

// Mock window.confirm for tests  
global.confirm = jest.fn()

// Mock window.alert for tests
global.alert = jest.fn()

// Mock fetch for tests
global.fetch = jest.fn()

// Mock FormData for tests
global.FormData = jest.fn(() => ({
  append: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  entries: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  forEach: jest.fn()
}))

// Mock Blob for tests
global.Blob = jest.fn((content, options) => ({
  content,
  options,
  size: content ? content.length : 0,
  type: options?.type || ''
}))

// Setup DOM testing utilities
import '@testing-library/jest-dom'