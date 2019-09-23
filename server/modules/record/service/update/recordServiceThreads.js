const R = require('ramda')
const path = require('path')

const ThreadManager = require('../../../../threads/threadManager')
const RecordUpdateThreadParams = require('./thread/recordUpdateThreadParams')
const ThreadParams = require('../../../../threads/threadParams')

const WebSocket = require('../../../../utils/webSocket')
const WebSocketEvents = require('../../../../../common/webSocket/webSocketEvents')

const RecordUsersMap = require('../update/recordUsersMap')
const RecordThreadsMap = require('../update/recordThreadsMap')
const recordThreadMessageTypes = require('./thread/recordThreadMessageTypes')

const recordThreadTimeouts = {}

const _createRecordThread = (user, surveyId, recordUuid, singleMessageHandling = false, initRecord) => {
  const filePath = path.resolve(__dirname, 'thread', 'recordUpdateThread.js')

  const data = {
    [ThreadParams.keys.user]: user,
    [ThreadParams.keys.surveyId]: surveyId,
    [RecordUpdateThreadParams.keys.recordUuid]: recordUuid,
    [RecordUpdateThreadParams.keys.initRecord]: initRecord
  }

  const messageHandler = msg => {

    if (msg.type === recordThreadMessageTypes.threadKill) {
      if (RecordThreadsMap.isZombie(recordUuid)) {
        const thread = RecordThreadsMap.get(recordUuid)
        thread.terminate()

        delete recordThreadTimeouts[recordUuid]
        clearTimeout(recordThreadTimeouts[recordUuid])
      }
    } else {
      const userUuids = RecordUsersMap.getUserUuids(recordUuid)
      userUuids.forEach(userUuid =>
        WebSocket.notifyUser(userUuid, msg.type, R.prop('content', msg))
      )
    }
  }

  const exitHandler = () => {
    RecordUsersMap.dissocUsers(recordUuid)
    RecordThreadsMap.remove(recordUuid)
  }

  const thread = new ThreadManager(filePath, data, messageHandler, exitHandler, singleMessageHandling)

  return RecordThreadsMap.put(recordUuid, thread)
}

const killRecordThread = recordUuid => {
  const thread = RecordThreadsMap.get(recordUuid)

  RecordThreadsMap.markZombie(recordUuid)
  thread.postMessage({ type: recordThreadMessageTypes.threadKill })
}

const getOrCreatedRecordThread = (user, surveyId, recordUuid, singleMessageHandling = false, initRecord = false) => {
  if (RecordThreadsMap.isZombie(recordUuid)) {
    RecordThreadsMap.reviveZombie(recordUuid)
  }

  const thread = RecordThreadsMap.get(recordUuid) ||
    _createRecordThread(user, surveyId, recordUuid, singleMessageHandling, initRecord)

  clearTimeout(recordThreadTimeouts[recordUuid])
  recordThreadTimeouts[recordUuid] = setTimeout(() => {
    killRecordThread(recordUuid)

    const userUuids = RecordUsersMap.getUserUuids(recordUuid)
    userUuids.forEach(userUuid =>
      WebSocket.notifyUser(userUuid, WebSocketEvents.recordEditTimeout, recordUuid)
    )
  }, 60 * 60 * 1000)

  return thread
}

module.exports = {
  getOrCreatedRecordThread,
  getRecordThread: RecordThreadsMap.get,
  killRecordThread,
}
