import ThreadsCache from '@server/threads/threadsCache'

const threads = new ThreadsCache()
const threadZombies = new Set() // Set of threads marked to be killed

// thread cache
export const get = recordUuid => threads.getThread(recordUuid)

export const put = (recordUuid, thread) => threads.putThread(recordUuid, thread)

export const remove = recordUuid => {
  threads.removeThread(recordUuid)
  threadZombies.delete(recordUuid)
}

// Thread zombies
export const markZombie = recordUuid => threadZombies.add(recordUuid)

export const reviveZombie = recordUuid => threadZombies.delete(recordUuid)

export const isZombie = recordUuid => threadZombies.has(recordUuid)
