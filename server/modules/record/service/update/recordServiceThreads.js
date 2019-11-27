import * as R from 'ramda'

import ThreadManager from '@server/threads/threadManager'
import * as ThreadParams from '@server/threads/threadParams'

import * as WebSocket from '@server/utils/webSocket'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as RecordThreadsMap from './recordThreadsMap'
import * as RecordSocketsMap from './recordSocketsMap'
import * as RecordUpdateThreadParams from './thread/recordUpdateThreadParams'
import { messageTypes as RecordThreadMessageTypes } from './thread/recordThreadMessageTypes'

const recordThreadTimeouts = {}

// ======
// THREAD
// ======

// ====== CREATE
const _createRecordThread = (socketId, user, surveyId, recordUuid) => {
  const data = {
    [ThreadParams.keys.socketId]: socketId,
    [ThreadParams.keys.user]: user,
    [ThreadParams.keys.surveyId]: surveyId,
    [RecordUpdateThreadParams.keys.recordUuid]: recordUuid,
  }

  const messageHandler = msg => {
    if (msg.type === RecordThreadMessageTypes.threadKill) {
      if (RecordThreadsMap.isZombie(recordUuid)) {
        clearTimeout(recordThreadTimeouts[recordUuid])
        delete recordThreadTimeouts[recordUuid]

        const thread = getRecordThread(recordUuid)
        thread.terminate()
      }
    } else {
      // Notify all sockets that have checked in the record
      const socketIds = RecordSocketsMap.getSocketIds(recordUuid)
      socketIds.forEach(socketIdCurrent => {
        WebSocket.notifySocket(
          socketIdCurrent,
          msg.type,
          R.prop('content', msg),
        )
      })
    }
  }

  const exitHandler = () => {
    RecordSocketsMap.dissocSockets(recordUuid)
    RecordThreadsMap.remove(recordUuid)
  }

  const thread = new ThreadManager(
    'recordUpdateThread.js',
    data,
    messageHandler,
    exitHandler,
  )

  return RecordThreadsMap.put(recordUuid, thread)
}

// ====== READ

const _resetThreadInactivityTimeout = recordUuid => {
  clearTimeout(recordThreadTimeouts[recordUuid])

  // After one hour of inactivity, thread gets killed and user is notified
  recordThreadTimeouts[recordUuid] = setTimeout(() => {
    killRecordThread(recordUuid)

    const userUuids = RecordSocketsMap.getSocketIds(recordUuid)
    userUuids.forEach(userUuid =>
      WebSocket.notifyUser(
        userUuid,
        WebSocketEvents.recordSessionExpired,
        recordUuid,
      ),
    )
  }, 60 * 60 * 1000)
}

export const getRecordThread = RecordThreadsMap.get

export const getOrCreatedRecordThread = (
  socketId,
  user,
  surveyId,
  recordUuid,
) => {
  if (RecordThreadsMap.isZombie(recordUuid)) {
    RecordThreadsMap.reviveZombie(recordUuid)
  }

  const thread =
    getRecordThread(recordUuid) ||
    _createRecordThread(socketId, user, surveyId, recordUuid)
  _resetThreadInactivityTimeout(recordUuid)
  return thread
}

// ====== DELETE
export const killRecordThread = recordUuid => {
  const thread = getRecordThread(recordUuid)

  RecordThreadsMap.markZombie(recordUuid)
  thread.postMessage({ type: RecordThreadMessageTypes.threadKill })
}

// ======
// SOCKETS
// ======

export const getSocketIds = RecordSocketsMap.getSocketIds

export const assocSocket = RecordSocketsMap.assocSocket

const _terminateThreadIfNoSockets = recordUuid => {
  const thread = getRecordThread(recordUuid)
  // Terminate thread if there are no more users editing the record
  if (thread && !RecordSocketsMap.hasSockets(recordUuid)) {
    killRecordThread(recordUuid)
  }
}

export const dissocSocket = socketId => {
  const recordUuid = RecordSocketsMap.getRecordUuid(socketId)
  if (recordUuid) {
    RecordSocketsMap.dissocSocket(recordUuid, socketId)
    _terminateThreadIfNoSockets(recordUuid)
  }
}

export const dissocSocketsByRecordUuid = recordUuid => {
  RecordSocketsMap.dissocSockets(recordUuid)
  _terminateThreadIfNoSockets(recordUuid)
}
