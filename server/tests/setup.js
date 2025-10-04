// Jest setup file
import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
// Only set MONGODB_URI if it's not explicitly set to empty and not in CI
if (!process.env.MONGODB_URI && !process.env.CI) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/ethical-product-finder-test';
}

// Suppress console.log during tests unless DEBUG is set
if (!process.env.DEBUG) {
    console.log = jest.fn();
    console.info = jest.fn();
}
