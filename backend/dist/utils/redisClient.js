import { createClient } from "redis";
import { REDIS_URL } from "./config.js";
const redisClient = createClient({ url: REDIS_URL });
let isConnected = false;
let connectionAttempted = false;
// Suppress repeated connection errors
redisClient.on("error", (err) => {
    if (!connectionAttempted)
        return;
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
function get(key, callback) {
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
            .catch((err) => callback(err, null));
        return;
    }
    return redisClient.get(key);
}
function set(key, value, options) {
    if (!isConnected)
        return Promise.resolve("OK");
    return redisClient.set(key, value, options);
}
function setex(key, seconds, value) {
    if (!isConnected)
        return Promise.resolve("OK");
    return redisClient.setEx(key, seconds, value);
}
const redisWrapper = {
    isConnected() {
        return isConnected;
    },
};
export default {
    isConnected: () => isConnected,
    get,
    set,
    setex,
};
