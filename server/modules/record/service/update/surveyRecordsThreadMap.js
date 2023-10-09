import ThreadsCache from '@server/threads/threadsCache'

const threads = new ThreadsCache()
const threadZombies = new Set() // Set of threads marked to be killed

// thread cache
const getKey = () => `survey_records_thread`
const get = (threadKey) => threads.getThread(threadKey)
const put = (threadKey, thread) => threads.putThread(threadKey, thread)

const remove = (threadKey) => {
  threads.removeThread(threadKey)
  threadZombies.delete(threadKey)
}

// Thread zombies (inactive threads, to be deleted at timeout)
const markZombie = (threadKey) => threadZombies.add(threadKey)

const reviveZombie = (threadKey) => threadZombies.delete(threadKey)

const isZombie = (threadKey) => threadZombies.has(threadKey)

export const SurveyRecordsThreadMap = {
  getKey,
  get,
  put,
  remove,
  markZombie,
  reviveZombie,
  isZombie,
}
