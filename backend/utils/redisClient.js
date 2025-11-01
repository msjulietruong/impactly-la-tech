
import { createClient } from 'redis';
import { REDIS_URL } from './config.js';

const redisClient = createClient({ url: REDIS_URL });

let isConnected = false;
let connectionAttempted = false;

// Suppress repeated connection errors
redisClient.on('error', (err) => {
  if (!connectionAttempted) {
    // Will log once during connection attempt
    return;
  }
  if (isConnected) {
    // Only log if we were connected and then got an error
    console.error('Redis Client Error:', err.message);
  }
});

// Try to connect, but don't block if Redis is unavailable
connectionAttempted = true;
redisClient.connect().then(() => {
  isConnected = true;
  console.log('✅ Redis connected');
}).catch(() => {
  // Redis is optional - server can run without it
  // Silently fail - no need to log repeatedly
  isConnected = false;
});

// Export a wrapper that handles connection state
export default {
  isConnected: () => isConnected,
  get: (key, callback) => {
    if (!isConnected) {
      if (typeof callback === 'function') {
        callback(null, null);
        return;
      }
      return Promise.resolve(null);
    }
    if (typeof callback === 'function') {
      redisClient.get(key).then(val => callback(null, val)).catch(err => callback(err, null));
    } else {
      return redisClient.get(key);
    }
  },
  setex: (key, seconds, value) => {
    if (!isConnected) return Promise.resolve('OK');
    return redisClient.setEx(key, seconds, value);
  }
};
