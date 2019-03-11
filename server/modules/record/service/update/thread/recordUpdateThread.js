const R = require('ramda')

const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../../../threads/thread')

const SurveyManager = require('../../../../survey/persistence/surveyManager')
const surveyDependencyGraph = require('../../../../survey/surveyDependenchyGraph')
const RecordManager = require('../../../persistence/recordManager')

const RecordUpdateManager = require('../../../persistence/recordUpdateManager')

const Survey = require('../../../../../../common/survey/survey')
const Record = require('../../../../../../common/record/record')
const Queue = require('../../../../../../common/queue')

const WebSocketEvents = require('../../../../../../common/webSocket/webSocketEvents')

class RecordUpdateThread extends Thread {

  constructor (paramsObj) {
    super(paramsObj)

    this.queue = new Queue()
    this.processing = false
  }

  async getRecord (t) {
    if (!this.record) {
      const recordUuid = R.prop('recordUuid', this.params)
      this.record = await RecordManager.fetchRecordAndNodesByUuid(this.surveyId, recordUuid, t)
    }
    return this.record
  }

  async getSurvey () {
    if (!this.survey) {
      const record = await this.getRecord()
      const preview = Record.isPreview(record)
      const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, preview, true, false)

      // if in preview mode, unpublished dependencies have not been stored in the db, so we need to build them
      const dependencyGraph = preview
        ? surveyDependencyGraph.buildGraph(surveyDb)
        : await SurveyManager.fetchDependencies(this.surveyId)

      this.survey = Survey.assocDependencyGraph(dependencyGraph)(surveyDb)
    }

    return this.survey
  }

  _postMessage (type, content) {
    if (!R.isEmpty(content))
      this.postMessage({ type, content })
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

  async processMessage (msg) {
    const user = this.getUser()
    const survey = await this.getSurvey()
    const record = await this.getRecord()

    switch (msg.type) {

      case messageTypes.persistNode:
        this.record = await RecordUpdateManager.persistNode(
          user,
          survey,
          record,
          msg.node,
          this.handleNodesUpdated.bind(this),
          this.handleNodesValidationUpdated.bind(this)
        )
        break

      case messageTypes.deleteNode:
        this.record = await RecordUpdateManager.deleteNode(
          user,
          survey,
          record,
          msg.nodeUuid,
          this.handleNodesUpdated.bind(this),
          this.handleNodesValidationUpdated.bind(this)
        )
        break
    }
  }

}

new RecordUpdateThread()

