import dotenv from "dotenv";

if (!process.env.CI) {
  dotenv.config();
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required variable: ${name}`);
  }
  return value;
}

function parseNumber(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    console.warn(`Invalid number for ${name}, using fallback: ${fallback}`);
    return fallback;
  }
  return parsed;
}

export const PORT: number = parseNumber(
  process.env.PORT ?? process.env.WEBSITES_PORT,
  3001,
  "PORT",
);

export const MONGODB_URI: string = requireEnv(
  "MONGODB_URI",
  "mongodb://localhost:27017/ethical-product-finder",
);

export const REDIS_URL: string = requireEnv(
  "REDIS_URL",
  "redis://localhost:6379",
);

export const CACHE_TTL = parseNumber(process.env.CACHE_TTL, 36000, "CACHE_TTL");

console.log(
  "Redis URL (sanitized):",
  process.env.REDIS_URL?.replace(/:[^:]*@/, ":****@"),
);
