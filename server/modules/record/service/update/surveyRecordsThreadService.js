import { ClusterBus, WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import * as Log from '@server/log/log'
import ThreadManager from '@server/threads/threadManager'

import { RecordsUpdateThreadMessageTypes } from './thread/recordsThreadMessageTypes'
import { SurveyRecordsThreadMap } from './surveyRecordsThreadMap'
import * as RecordSocketsMap from './recordSocketsMap'

const Logger = Log.getLogger('SurveyRecordsThreadService')

const { get: getThreadByKey, getKey: getThreadKey } = SurveyRecordsThreadMap

const recordsUpdateThreadFileName = 'recordsUpdateThread.js'
const inactivityPeriod = 10 * 60 * 1000 // 10 mins
const threadTimeouts = {}

// ======
// THREAD
// ======

const clusterEventTargetType = 'recordsUpdateThread'
const clusterEventTypes = { surveyClear: 'surveyClear', recordClear: 'recordClear' }

const handleClusterEvent = (event) => {
  const { targetType, eventType, message } = event
  if (targetType !== clusterEventTargetType) return

  // Every cluster event is delivered to every dyno, including events about surveys/records this dyno
  // holds nothing for: use the plain lookup, not getThread(), which would reset the thread inactivity
  // timeout (preventing the thread from ever idling out) and could revive a thread being terminated.
  const thread = getThreadByKey(getThreadKey())
  if (!thread) return

  if (eventType === clusterEventTypes.surveyClear) {
    thread.postMessage({ type: RecordsUpdateThreadMessageTypes.surveyClear, ...message })
  } else if (eventType === clusterEventTypes.recordClear) {
    thread.postMessage({ type: RecordsUpdateThreadMessageTypes.recordClear, ...message })
  }
}

// Exported under a test-only name so tests can invoke it directly, without needing to intercept
// the ClusterBus.onEvent registration call below (which runs at module-load time, before any
// test's jest.spyOn setup could possibly run).
export const _handleClusterEventForTest = handleClusterEvent

ClusterBus.onEvent(handleClusterEvent)

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
      notifyRecordUpdateToSockets({ eventType: type, content }).catch((error) =>
        Logger.error(`error notifying record update to sockets: ${error}`)
      )
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
  ClusterBus.publish({
    targetType: clusterEventTargetType,
    targetId: `survey-${surveyId}`,
    eventType: clusterEventTypes.surveyClear,
    message: { surveyId, cycle, draft },
  }).catch((error) => Logger.error(`error publishing surveyClear cluster event: ${error}`))
}

const clearRecordDataFromThread = ({ surveyId, cycle, draft, recordUuid }) => {
  ClusterBus.publish({
    targetType: clusterEventTargetType,
    targetId: recordUuid,
    eventType: clusterEventTypes.recordClear,
    message: { surveyId, cycle, draft, recordUuid },
  }).catch((error) => Logger.error(`error publishing recordClear cluster event: ${error}`))
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

const notifyRecordUpdateToSockets = async ({ eventType, content }) => {
  const { recordUuid } = content
  const socketIds = await RecordSocketsMap.getSocketIdsByRecordUuid(recordUuid)
  for (const socketId of socketIds) {
    if (await WebSocketServer.isSocketConnected(socketId)) {
      WebSocketServer.notifySocket(socketId, eventType, content)
    } else {
      // socket has been disconnected without checking out the record
      await RecordSocketsMap.dissocSocket({ recordUuid, socketId })
    }
  }
}

const notifyRecordDeleteToSockets = async ({ socketIdUser, recordUuid, notifySameUser = true }) => {
  // Notify other users viewing or editing the record it has been deleted
  const socketIds = await RecordSocketsMap.getSocketIdsByRecordUuid(recordUuid)
  socketIds.forEach((socketId) => {
    if (socketId !== socketIdUser || notifySameUser) {
      WebSocketServer.notifySocket(socketId, WebSocketEvent.recordDelete, recordUuid)
    }
  })
  await RecordSocketsMap.dissocSocketsByRecordUuid(recordUuid)
}

export const RecordsUpdateThreadService = {
  getOrCreatedThread,
  getThread,
  killThread,
  clearSurveyDataFromThread,
  clearRecordDataFromThread,
  // sockets
  assocSocket,
  notifyRecordUpdateToSockets,
  notifyRecordDeleteToSockets,
  dissocSocket,
  dissocSocketBySocketId,
}
