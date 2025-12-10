// Jest setup file
import 'jest';

// Global test setup
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Mock Date.now for consistent testing
Object.defineProperty(Date, 'now', {
  value: jest.fn(() => 1487076708000),
  writable: true,
});