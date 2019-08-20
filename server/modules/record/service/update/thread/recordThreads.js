const ThreadsCache = require('../../../../../threads/threadsCache')

const threads = new ThreadsCache()

const getThreadByRecordUuid = threads.getThread.bind(threads)
const removeThreadByRecordUuid = threads.removeThread.bind(threads)
const putThreadByRecordUuid = threads.putThread.bind(threads)

module.exports = {
  getThreadByRecordUuid,
  removeThreadByRecordUuid,
  putThreadByRecordUuid,
}