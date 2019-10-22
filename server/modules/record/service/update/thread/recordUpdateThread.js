const R = require('ramda')

const Log = require('@server/log/log').getLogger('RecordUpdateThread')

const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('@server/threads/thread')

const SurveyManager = require('../../../../survey/manager/surveyManager')
const RecordManager = require('../../../manager/recordManager')

const Survey = require('@core/survey/survey')
const Record = require('@core/record/record')
const Validation = require('@core/validation/validation')
const Queue = require('@core/queue')

const WebSocketEvents = require('@common/webSocket/webSocketEvents')

const RecordUpdateThreadParams = require('./recordUpdateThreadParams')

class RecordUpdateThread extends Thread {

  constructor (paramsObj) {
    super(paramsObj)

    this.queue = new Queue()
    this.survey = null
    this.record = null
    this.processing = false

    this.sendThreadInitMsg()
  }

  sendThreadInitMsg () {
    (async () => {
      await this.messageHandler({ type: messageTypes.threadInit })
    })()
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
        recordValid: Validation.isObjValid(recordUpdated),
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

  async initRecordAndSurvey () {
    // init record
    this.record = await RecordManager.fetchRecordAndNodesByUuid(this.surveyId, RecordUpdateThreadParams.getRecordUuid(this.params))

    // init survey
    const preview = Record.isPreview(this.record)
    const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(this.surveyId, Record.getCycle(this.record), preview, true)

    // if in preview mode, unpublished dependencies have not been stored in the db, so we need to build them
    const dependencyGraph = preview
      ? Survey.buildDependencyGraph(surveyDb)
      : await SurveyManager.fetchDependencies(this.surveyId)

    this.survey = Survey.assocDependencyGraph(dependencyGraph)(surveyDb)
  }

  async processMessage (msg) {
    Log.debug('process message', msg)

    switch (msg.type) {
      case messageTypes.threadInit:
        await this.initRecordAndSurvey()
        break

      case messageTypes.recordInit:
        this.record = await RecordManager.initNewRecord(
          this.user,
          this.survey,
          this.record,
          this.handleNodesUpdated.bind(this),
          this.handleNodesValidationUpdated.bind(this)
        )
        break

      case messageTypes.nodePersist:
        this.record = await RecordManager.persistNode(
          msg.user,
          this.survey,
          this.record,
          msg.node,
          this.handleNodesUpdated.bind(this),
          this.handleNodesValidationUpdated.bind(this)
        )
        break

      case messageTypes.nodeDelete:
        this.record = await RecordManager.deleteNode(
          msg.user,
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

    if (R.includes(msg.type, [messageTypes.nodePersist, messageTypes.nodeDelete])) {
      this.postMessage({ type: WebSocketEvents.nodesUpdateCompleted })
    }
  }

}

new RecordUpdateThread()

