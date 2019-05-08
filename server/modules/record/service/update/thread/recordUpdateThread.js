const R = require('ramda')

const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../../../threads/thread')

const SurveyManager = require('../../../../survey/manager/surveyManager')
const RecordManager = require('../../../manager/recordManager')

const Survey = require('../../../../../../common/survey/survey')
const Record = require('../../../../../../common/record/record')
const Validator = require('../../../../../../common/validation/validator')
const Queue = require('../../../../../../common/queue')

const WebSocketEvents = require('../../../../../../common/webSocket/webSocketEvents')

class RecordUpdateThread extends Thread {

  constructor (paramsObj) {
    super(paramsObj)

    this.queue = new Queue()
    this.processing = false

    //cache
    this.survey = null
    this.record = null
  }

  async getRecord () {
    if (!this.record) {
      const recordUuid = R.prop('recordUuid', this.params)
      this.record = await RecordManager.fetchRecordAndNodesByUuid(this.surveyId, recordUuid)
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
        ? Survey.buildDependencyGraph(surveyDb)
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
    const recordUpdated = Record.mergeNodeValidations(validations)(this.record)

    this._postMessage(WebSocketEvents.nodeValidationsUpdate, {
      recordUuid: Record.getUuid(this.record),
      recordValid: Validator.isValid(recordUpdated),
      validations
    })
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
        this.record = await RecordManager.persistNode(
          user,
          survey,
          record,
          msg.node,
          this.handleNodesUpdated.bind(this),
          this.handleNodesValidationUpdated.bind(this)
        )
        break

      case messageTypes.deleteNode:
        this.record = await RecordManager.deleteNode(
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

