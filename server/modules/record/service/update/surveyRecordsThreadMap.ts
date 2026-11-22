import ThreadManager from '@server/threads/threadManager'
import ThreadsCache from '@server/threads/threadsCache'

const threads = new ThreadsCache<ThreadManager>()
const threadZombies = new Set<string>() // Set of threads marked to be killed

// thread cache
const getKey = () => `survey_records_thread`
const get = (threadKey: string) => threads.getThread(threadKey)
const put = (threadKey: string, thread: ThreadManager) => threads.putThread(threadKey, thread)

const remove = (threadKey: string) => {
  threads.removeThread(threadKey)
  threadZombies.delete(threadKey)
}

// Thread zombies (inactive threads, to be deleted at timeout)
const markZombie = (threadKey: string) => threadZombies.add(threadKey)

const reviveZombie = (threadKey: string) => threadZombies.delete(threadKey)

const isZombie = (threadKey: string) => threadZombies.has(threadKey)

export const SurveyRecordsThreadMap = {
  getKey,
  get,
  put,
  remove,
  markZombie,
  reviveZombie,
  isZombie,
}
