import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import ThreadManager from '@server/threads/threadManager'
import * as ThreadParams from '@server/threads/threadParams'

import { RecordsUpdateThreadMessageTypes } from './thread/recordsThreadMessageTypes'
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
    const { type, content } = msg
    if (type === RecordsUpdateThreadMessageTypes.threadKill) {
      if (SurveyRecordsThreadMap.isZombie(threadKey)) {
        clearTimeout(threadTimeouts[threadKey])
        delete threadTimeouts[threadKey]

        const thread = getThread(threadKey)
        thread.terminate()
      }
    } else {
      notifyRecordUpdateToSockets({ eventType: type, content })
    }
  }

  const exitHandler = () => {
    // RecordSocketsMap.dissocSockets(recordUuid)
    SurveyRecordsThreadMap.remove(threadKey)
  }

  const thread = new ThreadManager('surveyRecordsUpdateThread.js', threadData, handleMessageFromThread, exitHandler)

  return SurveyRecordsThreadMap.put(threadKey, thread)
}

// ====== DELETE
const _killThread = (threadKey) => {
  clearTimeout(threadTimeouts[threadKey])
  const thread = getThread(threadKey)

  if (thread) {
    SurveyRecordsThreadMap.markZombie(threadKey)
    thread.postMessage({ type: RecordsUpdateThreadMessageTypes.threadKill })
  }
}

const killThread = ({ surveyId, cycle, draft }) => {
  const threadKey = getThreadKey({ surveyId, cycle, draft })
  _killThread(threadKey)
}

const killSurveyThreads = ({ surveyId }) => {
  const threadKeys = SurveyRecordsThreadMap.getThreadsKeysBySurveyId({ surveyId })
  threadKeys.forEach(_killThread)
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

// ====== WebSocket notification

const notifyRecordUpdateToSockets = ({ eventType, content }) => {
  const { recordUuid } = content
  const socketIds = RecordSocketsMap.getSocketIds(recordUuid)
  socketIds.forEach((socketId) => {
    WebSocketServer.notifySocket(socketId, eventType, content)
  })
}

const notifyRecordDeleteToSockets = ({ socketIdUser, recordUuid, notifySameUser = true }) => {
  // Notify other users viewing or editing the record it has been deleted
  const socketIds = RecordSocketsMap.getSocketIds(recordUuid)
  socketIds.forEach((socketId) => {
    if (socketId !== socketIdUser || notifySameUser) {
      WebSocketServer.notifySocket(socketId, WebSocketEvent.recordDelete, recordUuid)
    }
  })
  RecordSocketsMap.dissocSockets(recordUuid)
}

export const SurveyRecordsThreadService = {
  getOrCreatedThread,
  killThread,
  killSurveyThreads,
  notifyRecordDeleteToSockets,
}
