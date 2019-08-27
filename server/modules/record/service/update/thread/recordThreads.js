const ThreadsCache = require('../../../../../threads/threadsCache')

const threads = new ThreadsCache()

const getThreadByRecordUuid = threads.getThread.bind(threads)
const removeThreadByRecordUuid = threads.removeThread.bind(threads)
const putThreadByRecordUuid = threads.putThread.bind(threads)

/**
 * ======
 * zombie thread management: i.e. threads that are marked to be killed
 * ======
 */
const threadZombies = new Set()

const markZombie = recordUuid => threadZombies.add(recordUuid)
const reviveZombie = recordUuid => threadZombies.delete(recordUuid)
const isZombie = recordUuid => threadZombies.has(recordUuid)

module.exports = {
  getThreadByRecordUuid,
  removeThreadByRecordUuid,
  putThreadByRecordUuid,

  markZombie,
  reviveZombie,
  isZombie,
}