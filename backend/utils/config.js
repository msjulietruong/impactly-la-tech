import dotenv from 'dotenv';

if (!process.env.CI) {
    dotenv.config();
}

export const PORT = process.env.PORT || process.env.WEBSITES_PORT || 3001;

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ethical-product-finder';

export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 36000;
