const R = require('ramda')
const path = require('path')

const ThreadManager = require('../../../threads/threadManager')
const RecordUpdateThreadParams = require('./update/thread/recordUpdateThreadParams')
const ThreadParams = require('../../../threads/threadParams')

const WebSocket = require('../../../utils/webSocket')

const RecordUsersMap = require('./update/recordUsersMap')
const RecordThreads = require('./update/thread/recordThreads')
const recordThreadMessageTypes = require('./update/thread/recordThreadMessageTypes')

const recordThreadTimeouts = {}

const _createRecordThread = (user, surveyId, recordUuid, preview, singleMessageHandling = false, initRecord) => {
  const filePath = path.resolve(__dirname, 'update', 'thread', 'recordUpdateThread.js')

  const data = {
    [ThreadParams.keys.user]: user,
    [ThreadParams.keys.surveyId]: surveyId,
    [RecordUpdateThreadParams.keys.recordUuid]: recordUuid,
    [RecordUpdateThreadParams.keys.initRecord]: initRecord
  }

  const messageHandler = msg => {

    if (msg.type === recordThreadMessageTypes.threadKill) {
      if (RecordThreads.isZombie(recordUuid)) {
        const thread = RecordThreads.get(recordUuid)
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
    RecordThreads.remove(recordUuid)
  }

  const thread = new ThreadManager(filePath, data, messageHandler, exitHandler, singleMessageHandling)

  return RecordThreads.put(recordUuid, thread)
}

const killRecordThread = recordUuid => {
  const thread = RecordThreads.get(recordUuid)

  RecordThreads.markZombie(recordUuid)
  thread.postMessage({ type: recordThreadMessageTypes.threadKill })
}

const getOrCreatedRecordThread = (user, surveyId, recordUuid, preview = false, singleMessageHandling = false, initRecord = false) => {
  const thread = RecordThreads.get(recordUuid) ||
    _createRecordThread(user, surveyId, recordUuid, preview, singleMessageHandling, initRecord)

  clearTimeout(recordThreadTimeouts[recordUuid])
  recordThreadTimeouts[recordUuid] = setTimeout(() => killRecordThread(recordUuid), 60 * 60 * 1000)

  return thread
}

module.exports = {
  getOrCreatedRecordThread,
  killRecordThread,
}
