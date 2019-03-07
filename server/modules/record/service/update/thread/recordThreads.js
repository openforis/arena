const ThreadsCache = require('../../../../../threads/threadsCache')

const threads = new ThreadsCache()

module.exports = {
  getThreadByUserId: userId => threads.getThread(userId),
  removeThreadByUserId: userId => threads.removeThread(userId),
  putThreadByUserId: (userId, thread) => threads.putThread(userId, thread),
}