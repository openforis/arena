const ThreadsCache = require('../../../../../threads/threadsCache')

const threads = new ThreadsCache()

module.exports = {
  getThreadByUserId : threads.getThread,
  removeThreadByUserId : threads.removeThread,
  putThreadByUserId : threads.putThread,
  getThreadByUserId : threads.getThread,
}