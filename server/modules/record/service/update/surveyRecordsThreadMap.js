import ThreadsCache from '@server/threads/threadsCache'

const threads = new ThreadsCache()
const threadZombies = new Set() // Set of threads marked to be killed

// thread cache
const getKey = ({ surveyId, cycle, draft }) => `${surveyId}_${cycle}_${draft}`
const get = (threadKey) => threads.getThread(threadKey)
const getThreadsKeysBySurveyId = ({ surveyId }) => threads.findThreadsKeys((key) => key.startsWith(`${surveyId}_`))
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
  getThreadsKeysBySurveyId,
  put,
  remove,
  markZombie,
  reviveZombie,
  isZombie,
}
