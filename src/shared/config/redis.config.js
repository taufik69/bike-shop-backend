const IORedis = require("ioredis");
const { env } = require("./env.config");

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const cache = new IORedis(env.REDIS_URL, {
  tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
});
module.exports = { connection, cache };
