import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import ThreadManager from '@server/threads/threadManager'

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
const _createThread = () => {
  const threadData = {}
  const threadKey = getThreadKey()

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

const killThread = () => {
  const threadKey = getThreadKey()
  _killThreadByKey(threadKey)
}

const clearSurveyDataFromThread = ({ surveyId, cycle = null, draft = false }) => {
  const thread = getThread()
  thread?.postMessage({ type: RecordsUpdateThreadMessageTypes.surveyClear, surveyId, cycle, draft })
}

const clearRecordDataFromThread = ({ surveyId, cycle, draft, recordUuid }) => {
  const thread = getThread()
  thread?.postMessage({ type: RecordsUpdateThreadMessageTypes.recordClear, surveyId, cycle, draft, recordUuid })
}

// ====== READ

const _resetThreadInactivityTimeout = (threadKey) => {
  clearTimeout(threadTimeouts[threadKey])

  // After one hour of inactivity, thread gets killed and user is notified
  threadTimeouts[threadKey] = setTimeout(_killThreadByKey.bind(null, threadKey), inactivityPeriod)
}

const getThread = () => {
  const threadKey = getThreadKey()
  if (SurveyRecordsThreadMap.isZombie(threadKey)) {
    SurveyRecordsThreadMap.reviveZombie(threadKey)
  }
  const thread = getThreadByKey(threadKey)
  if (thread) {
    _resetThreadInactivityTimeout(threadKey)
  }
  return thread
}

const getOrCreatedThread = () => {
  let thread = getThread()
  if (!thread) {
    thread = _createThread()
    const threadKey = getThreadKey()
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
  clearSurveyDataFromThread,
  clearRecordDataFromThread,
  // sockets
  assocSocket,
  notifyRecordDeleteToSockets,
  dissocSocket,
  dissocSocketBySocketId,
}
