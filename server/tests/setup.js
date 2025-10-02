// Jest setup file
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ethical-product-finder-test';

// Suppress console.log during tests unless DEBUG is set
if (!process.env.DEBUG) {
  // Keep console.log for debugging tests
  global.console = {
    ...console,
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
