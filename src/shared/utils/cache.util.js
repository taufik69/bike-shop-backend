const { cache } = require("@/shared/config/redis.config");

const getCache = async (key) => {
  const data = await cache.get(key);
  return data ? JSON.parse(data) : null;
};

const setCache = async (key, value, ttl = 60) => {
  await cache.set(key, JSON.stringify(value), "EX", ttl);
};

const deleteCache = async (key) => {
  await cache.del(key);
};

const flushdb = async () => {
  await cache.flushdb();
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  flushdb,
};
