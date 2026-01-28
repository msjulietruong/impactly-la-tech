import { createClient, RedisClientType, SetOptions } from "redis";
import { REDIS_URL } from "./config.js";

const redisClient: RedisClientType = createClient({ url: REDIS_URL });

let isConnected = false;
let connectionAttempted = false;

// Suppress repeated connection errors
redisClient.on("error", (err: Error) => {
  if (!connectionAttempted) return;

  if (isConnected) {
    console.error("Redis Client Error:", err.message);
  }
});

// Try to connect, but don't block if Redis is unavailable
connectionAttempted = true;
redisClient
  .connect()
  .then(() => {
    isConnected = true;
    console.log("Redis connected");
  })
  .catch(() => {
    // Silently fail
    isConnected = false;
  });

type Callback<T> = (err: Error | null, result: T | null) => void;

function get(key: string): Promise<string | null>;
function get(key: string, callback: Callback<string>): void;
function get(
  key: string,
  callback?: Callback<string>,
): Promise<string | null> | void {
  if (!isConnected) {
    if (callback) {
      callback(null, null);
      return;
    }
    return Promise.resolve(null);
  }

  if (callback) {
    redisClient
      .get(key)
      .then((val) => callback(null, val))
      .catch((err: Error) => callback(err, null));
    return;
  }

  return redisClient.get(key);
}

function set(
  key: string,
  value: string,
  options?: SetOptions,
): Promise<string | null> {
  if (!isConnected) return Promise.resolve("OK");
  return redisClient.set(key, value, options);
}

function setex(key: string, seconds: number, value: string): Promise<string> {
  if (!isConnected) return Promise.resolve("OK");
  return redisClient.setEx(key, seconds, value);
}

const redisWrapper = {
  isConnected(): boolean {
    return isConnected;
  },
};

export default {
  isConnected: (): boolean => isConnected,
  get,
  set,
  setex,
};
