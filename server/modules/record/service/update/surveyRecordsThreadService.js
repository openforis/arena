import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import ThreadManager from '@server/threads/threadManager'
import * as ThreadParams from '@server/threads/threadParams'

import { messageTypes as RecordThreadMessageTypes } from './thread/recordThreadMessageTypes'
import { SurveyRecordsThreadMap } from './surveyRecordsThreadMap'
import * as RecordSocketsMap from './recordSocketsMap'

const { get: getThread, getKey: getThreadKey } = SurveyRecordsThreadMap

const INACTIVITY_PERIOD = 10 * 60 * 1000 // 10 mins
const threadTimeouts = {}

// ======
// THREAD
// ======

// ====== CREATE
const _createThread = ({ surveyId, cycle, draft }) => {
  const threadData = {
    [ThreadParams.keys.surveyId]: surveyId,
    [ThreadParams.keys.draft]: draft,
    [ThreadParams.keys.cycle]: cycle,
  }
  const threadKey = getThreadKey({ surveyId, cycle, draft })

  const handleMessageFromThread = (msg) => {
    const { content, type } = msg
    if (type === RecordThreadMessageTypes.threadKill) {
      if (SurveyRecordsThreadMap.isZombie(threadKey)) {
        clearTimeout(threadTimeouts[threadKey])
        delete threadTimeouts[threadKey]

        const thread = getThread(threadKey)
        thread.terminate()
      }
    } else {
      // Notify all sockets that have checked in the record
      const { recordUuid } = content
      const socketIds = RecordSocketsMap.getSocketIds(recordUuid)
      socketIds.forEach((socketIdCurrent) => {
        WebSocketServer.notifySocket(socketIdCurrent, type, content)
      })
    }
  }

  const exitHandler = (args) => {
    // RecordSocketsMap.dissocSockets(recordUuid)
    SurveyRecordsThreadMap.remove(threadKey)
  }

  const thread = new ThreadManager('surveyRecordsUpdateThread.js', threadData, handleMessageFromThread, exitHandler)

  return SurveyRecordsThreadMap.put(threadKey, thread)
}

// ====== DELETE
const killThread = ({ surveyId, cycle, draft }) => {
  const threadKey = getThreadKey({ surveyId, cycle, draft })
  _killThread(threadKey)
}

const _killThread = (threadKey) => {
  clearTimeout(threadTimeouts[threadKey])
  const thread = getThread(threadKey)

  if (thread) {
    SurveyRecordsThreadMap.markZombie(threadKey)
    thread.postMessage({ type: RecordThreadMessageTypes.threadKill })
  }
}

// ====== READ

const _resetThreadInactivityTimeout = (threadKey) => {
  clearTimeout(threadTimeouts[threadKey])

  // After one hour of inactivity, thread gets killed and user is notified
  threadTimeouts[threadKey] = setTimeout(_killThread.bind(null, threadKey), INACTIVITY_PERIOD)
}

const getOrCreatedThread = ({ surveyId, cycle, draft = false }) => {
  const threadKey = getThreadKey({ surveyId, cycle, draft })
  if (SurveyRecordsThreadMap.isZombie(threadKey)) {
    SurveyRecordsThreadMap.reviveZombie(threadKey)
  }

  const thread = getThread(threadKey) || _createThread({ surveyId, cycle, draft })
  _resetThreadInactivityTimeout(threadKey)
  return thread
}

export const SurveyRecordsThreadService = {
  getOrCreatedThread,
  killThread,
}
