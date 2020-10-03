const Redis = require('ioredis')

//const HOST = 'host.docker.internal'
const HOST = 'redis-rstudio-service.lserka.ng.0001.euc1.cache.amazonaws.com'
const PORT = 6379
const redisConfig = { host: HOST, port: PORT }

const redis = new Redis(redisConfig)

module.exports = {
  set: async (key, value) => redis.set(key, value),
  get: async (key) => redis.get(key),
  keys: async () => redis.keys('*'),
  remove: async (key) => redis.unlink(key),
  removeAll: async () => redis.flushall(),
}
