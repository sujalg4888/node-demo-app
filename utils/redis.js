const { createClient } = require("redis");
const hash = require("object-hash");

let redisClient = undefined;

/** Initializes a Redis client and connects to a Redis server.
 * If the REDIS_URI environment variable is set, it uses that as the connection URL.
 * If not, it defaults to "redis://localhost:6379".
 * @returns {Promise<void>} A promise that resolves when the connection to the Redis server is successful.
 */
async function initializeRedisClient() {
  let redisURL = process.env.REDIS_URI || "redis://localhost:6379";
  if (redisURL) {
      redisClient = createClient({ url: redisURL }).on("error", (e) => {
      console.error(`Failed to create the Redis client with error:`, e);
    });

    try {
      await redisClient.connect();
      console.log(`Connected to Redis successfully!`);
    } catch (e) {
      console.error(`Connection to Redis failed with error:`, e);
    }
  }
};

/** Generates a unique key for caching HTTP requests based on the request path and data.
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.query - The query parameters of the request.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.path - The path of the request.
 * @returns {string} A unique key for caching the request.
 */
function requestToKey(req) {
  // build a custom object to use as part of the Redis key
  const reqDataToHash = {
    query: req.query,
    body: req.body,
  };
  // `${req.path}@...` to make it easier to find keys on a Redis client
  return `${req.path}@${hash.sha1(reqDataToHash)}`;
};

/** Checks if there is an active connection to a Redis server.
 * @returns {boolean} True if there is an active connection, false otherwise.
 */
function isRedisWorking() {
  return !!redisClient?.isOpen;
};

/** Writes data to the Redis cache with the provided key and options.
 * @param {string} key - The unique key for the data in the Redis cache.
 * @param {any} data - The data to be cached.
 * @param {Object} options - Additional options for setting the data in the Redis cache.
 * @param {number} [options.EX] - The expiration time in seconds for the key.
 * @param {number} [options.PX] - The expiration time in milliseconds for the key.
 * @param {string} [options.NX] - Only set the key if it does not already exist.
 * @param {string} [options.XX] - Only set the key if it already exists.
 * @returns {Promise<void>} A promise that resolves when the data is successfully cached in Redis.
 */
async function writeData(key, data, options) {
  if (isRedisWorking()) {
    try {
      // write data to the Redis cache
      await redisClient.set(key, data, options);
    } catch (e) {
      console.error(`Failed to cache data for key=${key}`, e);
    }
  }
};

/** Retrieves data from the Redis cache using the provided key.
 * If the Redis client is not working, it returns `undefined`.
 * @param {string} key - The unique key for the data in the Redis cache.
 * @returns {Promise<any>} A promise that resolves with the cached data if available,
 * or `undefined` if the Redis client is not working.
 */
async function readData(key) {
  let cachedValue = undefined;
  if (isRedisWorking()) {
    // try to get the cached response from redis
    return await redisClient.get(key);
  }

  return cachedValue;
};

/** Middleware for caching responses using Redis.
 * @param {Object} options - Configuration options for caching.
 * @param {number} options.EX - Expiration time for cached data in seconds. Default is 21600 seconds (6 hours).
 * @returns {Function} Middleware function to handle caching.
 */
function redisCachingMiddleware(options = { EX: 300 /*Cache Expiration in 5mins */ }) {
  return async (req, res, next) => {
    if (isRedisWorking()) {
      const key = requestToKey(req);
      // if there is some cached data, retrieve it and return it
      const cachedValue = await readData(key);
      if (cachedValue) {
        try {
          // if it is JSON data, then return it
          return res.json(JSON.parse(cachedValue));
        } catch {
          // if it is not JSON data, then return it
          return res.send(cachedValue);
        }
      } else {
        // override how res.send behaves to introduce the caching logic
        const oldSend = res.send;
        res.send = function (data) {
          // set the function back to avoid the 'double-send' effect
          res.send = oldSend;

          // cache the response only if it is successful
          if (res.statusCode.toString().startsWith("2")) {
            writeData(key, data, options).then();
          }

          return res.send(data);
        };

        // continue to the controller function
        next();
      }
    } else {
      // proceed with no caching
      next();
    }
  };
};

module.exports = {
  initializeRedisClient,
  redisCachingMiddleware
 };
