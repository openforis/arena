const R = require('ramda')

const Log = require('../../../../../log/log').getLogger('RecordUpdateThread')

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

    this.survey = null
    this.record = null
    this.processing = true

    this._init()
      .then(() => {
        this.processing = false
      })

  }

  async _init () {
    await this._initRecord()
    await this._initSurvey()
  }

  async _initRecord () {
    const recordUuid = R.prop('recordUuid', this.params)
    this.record = await RecordManager.fetchRecordAndNodesByUuid(this.surveyId, recordUuid)
  }

  async _initSurvey () {
    const preview = Record.isPreview(this.record)
    const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(this.surveyId, preview, true, false)

    // if in preview mode, unpublished dependencies have not been stored in the db, so we need to build them
    const dependencyGraph = preview
      ? Survey.buildDependencyGraph(surveyDb)
      : await SurveyManager.fetchDependencies(this.surveyId)

    this.survey = Survey.assocDependencyGraph(dependencyGraph)(surveyDb)
  }

  async handleNodesUpdated (updatedNodes) {
    if (!R.isEmpty(updatedNodes)) {
      this.postMessage({
        type: WebSocketEvents.nodesUpdate,
        content: updatedNodes
      })
    }
  }

  async handleNodesValidationUpdated (validations) {
    const recordUpdated = Record.mergeNodeValidations(validations)(this.record)

    this.postMessage({
      type: WebSocketEvents.nodeValidationsUpdate,
      content: {
        recordUuid: Record.getUuid(this.record),
        recordValid: Validator.isValid(recordUpdated),
        validations
      }
    })
  }

  async onMessage (msg) {
    this.queue.enqueue(msg)
    await this.processNext()
  }

  async processNext () {
    if (!this.processing && !this.queue.isEmpty()) {
      this.processing = true

      const msg = this.queue.dequeue()
      await this.processMessage(msg)

      this.processing = false
      await this.processNext()
    }
  }

  async processMessage (msg) {
    Log.debug('process message', msg)

    switch (msg.type) {

      case messageTypes.nodePersist:
        this.record = await RecordManager.persistNode(
          this.user,
          this.survey,
          this.record,
          msg.node,
          this.handleNodesUpdated.bind(this),
          this.handleNodesValidationUpdated.bind(this)
        )
        break

      case messageTypes.nodeDelete:
        this.record = await RecordManager.deleteNode(
          this.user,
          this.survey,
          this.record,
          msg.nodeUuid,
          this.handleNodesUpdated.bind(this),
          this.handleNodesValidationUpdated.bind(this)
        )
        break

      case messageTypes.threadKill:
        this.postMessage(msg)
        break
    }
  }

}

new RecordUpdateThread()

