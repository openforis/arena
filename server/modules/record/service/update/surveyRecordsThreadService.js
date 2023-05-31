import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import ThreadManager from '@server/threads/threadManager'
import * as ThreadParams from '@server/threads/threadParams'

import { messageTypes as RecordThreadMessageTypes } from './thread/recordThreadMessageTypes'
import { SurveyRecordsThreadMap } from './surveyRecordsThreadMap'
import * as RecordSocketsMap from './recordSocketsMap'

const INACTIVITY_PERIOD = 60 * 60 * 1000 // 1 hour
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
  const threadKey = SurveyRecordsThreadMap.getThreadKey({ surveyId, cycle, draft })

  const messageHandler = (msg) => {
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

  const exitHandler = () => {
    // RecordSocketsMap.dissocSockets(recordUuid)
    SurveyRecordsThreadMap.remove(threadKey)
  }

  const thread = new ThreadManager('surveyRecordsUpdateThread.js', threadData, messageHandler, exitHandler)

  return SurveyRecordsThreadMap.put(threadKey, thread)
}

// ====== READ

const _resetThreadInactivityTimeout = (threadKey) => {
  clearTimeout(threadTimeouts[threadKey])

  // After one hour of inactivity, thread gets killed and user is notified
  threadTimeouts[threadKey] = setTimeout(() => {
    killThread(threadKey)

    // const userUuids = RecordSocketsMap.getSocketIds(recordUuid)
    // userUuids.forEach((userUuid) =>
    //   WebSocketServer.notifyUser(userUuid, WebSocketEvent.recordSessionExpired, recordUuid)
    // )
  }, INACTIVITY_PERIOD)
}

const getThread = SurveyRecordsThreadMap.get

const getOrCreatedThread = ({ socketId, surveyId, cycle, draft = false }) => {
  const threadKey = SurveyRecordsThreadMap.getThreadKey({ surveyId, cycle, draft })
  if (SurveyRecordsThreadMap.isZombie(threadKey)) {
    SurveyRecordsThreadMap.reviveZombie(threadKey)
  }

  const thread = getThread(threadKey) || _createThread({ socketId, surveyId, cycle, draft })
  _resetThreadInactivityTimeout(threadKey)
  return thread
}

// ====== DELETE
const killThread = ({ surveyId, cycle, draft }) => {
  const threadKey = SurveyRecordsThreadMap.getThreadKey({ surveyId, cycle, draft })
  const thread = getThread(threadKey)

  SurveyRecordsThreadMap.markZombie(threadKey)
  thread.postMessage({ type: RecordThreadMessageTypes.threadKill })
}

export const SurveyRecordsThreadService = {
  getOrCreatedThread,
  killThread,
}
