const { isMainThread } = require('worker_threads')

const R = require('ramda')

const db = require('../../../db/db')

const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')

const SurveyManager = require('../../../survey/surveyManager')
const surveyDependencyGraph = require('../../../survey/surveyDependenchyGraph')
const RecordManager = require('../persistence/recordManager')

const RecordUpdateManager = require('../persistence/recordUpdateManager')

const Survey = require('../../../../common/survey/survey')
const Record = require('../../../../common/record/record')
const Queue = require('../../../../common/queue')

const WebSocketEvents = require('../../../../common/webSocket/webSocketEvents')

class RecordUpdateThread extends Thread {

  constructor (paramsObj) {
    super(paramsObj)

    this.queue = new Queue()
    this.processing = false
    this.preview = R.propOr(false, 'preview', this.params)
  }

  async getSurvey (tx) {
    if (!this.survey) {
      const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, this.preview, true, false, tx)

      // if in preview mode, unpublished dependencies have not been stored in the db, so we need to build them
      let dependencyGraph = this.preview
        ? surveyDependencyGraph.buildGraph(surveyDb)
        : await SurveyManager.fetchDependencies(this.surveyId)

      this.survey = Survey.assocDependencyGraph(dependencyGraph)(surveyDb)
    }

    return this.survey
  }

  async initRecord (t) {
    const recordUuid = R.prop('recordUuid', this.params)
    this.record = await RecordManager.fetchRecordAndNodesByUuid(this.surveyId, recordUuid, t)
  }

  async getRecord (t) {
    if (!this.record) {
      await this.initRecord(t)
    }
    return this.record
  }

  async handleNodesUpdated (updatedNodes) {
    this._postMessage(WebSocketEvents.nodesUpdate, updatedNodes)
  }

  async handleNodesValidationUpdated (validations) {
    this._postMessage(WebSocketEvents.nodeValidationsUpdate, validations)
  }

  async onMessage (msg) {
    this.queue.enqueue(msg)

    await this.processNext()
  }

  async processNext () {
    if (!(this.processing || this.queue.isEmpty())) {

      this.processing = true

      const msg = this.queue.dequeue()
      await this.processMessage(msg)

      this.processing = false

      await this.processNext()
    }
  }

  _postMessage (type, content) {
    if (!(isMainThread || R.isEmpty(content)))
      this.postMessage({ type, content })
  }

  async processMessage (msg) {
    await db.tx(async t => {

      const user = this.getUser()
      const survey = await this.getSurvey(t)

      // 1. create record or update node
      switch (msg.type) {
        case messageTypes.createRecord:
          this.record = await RecordUpdateManager.createRecord(user, survey, msg.record, this.preview,
            this.handleNodesUpdated.bind(this), this.handleNodesValidationUpdated.bind(this), t)
          break
        case messageTypes.persistNode:
          await this.initRecord(t)
          this.record = await RecordUpdateManager.persistNode(user, survey, this.record, msg.node, this.preview,
            this.handleNodesUpdated.bind(this), this.handleNodesValidationUpdated.bind(this), t)
          break
        case messageTypes.deleteNode:
          await this.initRecord(t)
          this.record = await RecordUpdateManager.deleteNode(user, survey, this.record, msg.nodeUuid, this.preview,
            this.handleNodesUpdated.bind(this), this.handleNodesValidationUpdated.bind(this), t)
          break
      }
    })
  }
}

const newInstance = (params) => new RecordUpdateThread(params)

if (!isMainThread)
  newInstance()

module.exports = {
  newInstance
}