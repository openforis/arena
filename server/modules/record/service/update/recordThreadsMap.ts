import ThreadsCache from '../../../../threads/threadsCache';

const threads = new ThreadsCache()
const threadZombies = new Set() // set of threads marked to be killed

// thread cache
const get = recordUuid => threads.getThread(recordUuid)

const put = (recordUuid, thread) => threads.putThread(recordUuid, thread)

const remove = recordUuid => {
  threads.removeThread(recordUuid)
  threadZombies.delete(recordUuid)
}

// thread zombies
const markZombie = recordUuid => threadZombies.add(recordUuid)

const reviveZombie = recordUuid => threadZombies.delete(recordUuid)

const isZombie = recordUuid => threadZombies.has(recordUuid)

export default {
  get,
  remove,
  put,

  markZombie,
  reviveZombie,
  isZombie,
};
