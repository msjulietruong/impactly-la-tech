import dotenv from "dotenv";
if (!process.env.CI) {
    dotenv.config();
}
function requireEnv(name, fallback) {
    const value = process.env[name] ?? fallback;
    if (!value) {
        throw new Error(`Missing required variable: ${name}`);
    }
    return value;
}
function parseNumber(value, fallback, name) {
    if (!value)
        return fallback;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
        console.warn(`Invalid number for ${name}, using fallback: ${fallback}`);
        return fallback;
    }
    return parsed;
}
export const PORT = parseNumber(process.env.PORT ?? process.env.WEBSITES_PORT, 3001, "PORT");
export const MONGODB_URI = requireEnv("MONGODB_URI", "mongodb://localhost:27017/ethical-product-finder");
export const REDIS_URL = requireEnv("REDIS_URL", "redis://localhost:6379");
export const AGENT_API_ENDPOINT = requireEnv("AGENT_API_ENDPOINT", "http://localhost:8000");
export const AGENT_API_KEY = requireEnv("OPENAI_API_KEY", "");
export const CACHE_TTL = parseNumber(process.env.CACHE_TTL, 36000, "CACHE_TTL");
console.log("MONGODB URL (sanitized):", MONGODB_URI?.replace(/:[^:]*@/, ":****@"));
console.log("Redis URL (sanitized):", REDIS_URL?.replace(/:[^:]*@/, ":****@"));
