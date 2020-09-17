const Redis = require('ioredis')

const HOST = '172.16.123.1'
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
