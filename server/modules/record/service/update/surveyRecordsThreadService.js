import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import ThreadManager from '@server/threads/threadManager'
import * as ThreadParams from '@server/threads/threadParams'

import { RecordsUpdateThreadMessageTypes } from './thread/recordsThreadMessageTypes'
import { SurveyRecordsThreadMap } from './surveyRecordsThreadMap'
import * as RecordSocketsMap from './recordSocketsMap'

const { get: getThreadByKey, getKey: getThreadKey } = SurveyRecordsThreadMap

const recordsUpdateThreadFileName = 'recordsUpdateThread.js'
const inactivityPeriod = 10 * 60 * 1000 // 10 mins
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

        const thread = getThreadByKey(threadKey)
        thread.terminate()
      }
    } else {
      notifyRecordUpdateToSockets({ eventType: type, content })
    }
  }

  const exitHandler = () => {
    SurveyRecordsThreadMap.remove(threadKey)
  }

  const thread = new ThreadManager(recordsUpdateThreadFileName, threadData, handleMessageFromThread, exitHandler)

  return SurveyRecordsThreadMap.put(threadKey, thread)
}

// ====== DELETE
const _killThreadByKey = (threadKey) => {
  clearTimeout(threadTimeouts[threadKey])
  const thread = getThreadByKey(threadKey)

  if (thread) {
    SurveyRecordsThreadMap.markZombie(threadKey)
    thread.postMessage({ type: RecordsUpdateThreadMessageTypes.threadKill })
  }
}

const killThread = ({ surveyId, cycle, draft }) => {
  const threadKey = getThreadKey({ surveyId, cycle, draft })
  _killThreadByKey(threadKey)
}

const killSurveyThreads = ({ surveyId }) => {
  const threadKeys = SurveyRecordsThreadMap.getThreadsKeysBySurveyId({ surveyId })
  threadKeys.forEach(_killThreadByKey)
}

// ====== READ

const _resetThreadInactivityTimeout = (threadKey) => {
  clearTimeout(threadTimeouts[threadKey])

  // After one hour of inactivity, thread gets killed and user is notified
  threadTimeouts[threadKey] = setTimeout(_killThreadByKey.bind(null, threadKey), inactivityPeriod)
}

const getThread = ({ surveyId, cycle, draft = false }) => {
  const threadKey = getThreadKey({ surveyId, cycle, draft })
  if (SurveyRecordsThreadMap.isZombie(threadKey)) {
    SurveyRecordsThreadMap.reviveZombie(threadKey)
  }
  const thread = getThreadByKey(threadKey)
  if (thread) {
    _resetThreadInactivityTimeout(threadKey)
  }
  return thread
}

const getOrCreatedThread = ({ surveyId, cycle, draft = false }) => {
  let thread = getThread({ surveyId, cycle, draft })
  if (!thread) {
    thread = _createThread({ surveyId, cycle, draft })
    const threadKey = getThreadKey({ surveyId, cycle, draft })
    _resetThreadInactivityTimeout(threadKey)
  }
  return thread
}

// ====== WebSocket notification

const { assocSocket, dissocSocket, dissocSocketBySocketId } = RecordSocketsMap

const notifyRecordUpdateToSockets = ({ eventType, content }) => {
  const { recordUuid } = content
  const socketIds = RecordSocketsMap.getSocketIdsByRecordUuid(recordUuid)
  socketIds.forEach((socketId) => {
    if (WebSocketServer.isSocketConnected(socketId)) {
      WebSocketServer.notifySocket(socketId, eventType, content)
    } else {
      // socket has been disconnected without checking out the record
      RecordSocketsMap.dissocSocket({ recordUuid, socketId })
    }
  })
}

const notifyRecordDeleteToSockets = ({ socketIdUser, recordUuid, notifySameUser = true }) => {
  // Notify other users viewing or editing the record it has been deleted
  const socketIds = RecordSocketsMap.getSocketIdsByRecordUuid(recordUuid)
  socketIds.forEach((socketId) => {
    if (socketId !== socketIdUser || notifySameUser) {
      WebSocketServer.notifySocket(socketId, WebSocketEvent.recordDelete, recordUuid)
    }
  })
  RecordSocketsMap.dissocSocketsByRecordUuid(recordUuid)
}

export const RecordsUpdateThreadService = {
  getOrCreatedThread,
  getThread,
  killThread,
  killSurveyThreads,
  // sockets
  assocSocket,
  notifyRecordDeleteToSockets,
  dissocSocket,
  dissocSocketBySocketId,
}
