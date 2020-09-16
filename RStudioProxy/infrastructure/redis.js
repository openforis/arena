const Redis = require('ioredis')

const redisConfig = undefined

module.exports = {
  set: async (key, value) => {
    const redis = new Redis(redisConfig)
    const result = await redis.set(key, value)
    await redis.disconnect()
    return result
  },
  get: async (key) => {
    const redis = new Redis(redisConfig)
    const result = await redis.get(key)
    await redis.disconnect()
    return result
  },
  keys: async () => {
    const redis = new Redis(redisConfig)
    const result = await redis.keys('*')
    await redis.disconnect()
    return result
  },
  del: async (key) => {
    const redis = new Redis(redisConfig)
    const result = await redis.unlink(key)
    await redis.disconnect()
    return result
  },
  flushAll: async () => {
    const redis = new Redis(redisConfig)
    const result = await redis.flushall()
    await redis.disconnect()
    return result
  },
}
