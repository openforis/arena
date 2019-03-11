const ThreadsCache = require('../../../../../threads/threadsCache')

const threads = new ThreadsCache()

const getThreadByUserId = threads.getThread.bind(threads)
const removeThreadByUserId = threads.removeThread.bind(threads)
const putThreadByUserId = threads.putThread.bind(threads)

module.exports = {
  getThreadByUserId,
  removeThreadByUserId,
  putThreadByUserId,
}