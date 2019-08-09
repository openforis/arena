const ThreadsCache = require('../../../../../threads/threadsCache')

const threads = new ThreadsCache()

const getThreadByUserUuid = threads.getThread.bind(threads)
const removeThreadByUserUuid = threads.removeThread.bind(threads)
const putThreadByUserUuid = threads.putThread.bind(threads)

module.exports = {
  getThreadByUserUuid,
  removeThreadByUserUuid,
  putThreadByUserUuid,
}