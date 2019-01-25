const { isMainThread } = require('worker_threads')

const R = require('ramda')

const db = require('../../../db/db')

const RecordUpdater = require('./helpers/recordUpdater')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')

const SurveyManager = require('../../../survey/surveyManager')
const surveyDependencyGraph = require('../../../survey/surveyDependenchyGraph')
const SurveyRdbManager = require('../../../surveyRdb/surveyRdbManager')

const Survey = require('../../../../common/survey/survey')
const Node = require('../../../../common/record/node')
const Queue = require('../../../../common/queue')
const { toUuidIndexedObj } = require('../../../../common/survey/surveyUtils')

const DependentNodesUpdater = require('./helpers/dependentNodesUpdater')
const RecordValidator = require('./helpers/recordValidator')

const WebSocketEvents = require('../../../../common/webSocket/webSocketEvents')

class RecordUpdateThread extends Thread {

  constructor (paramsObj) {
    super(paramsObj)

    this.queue = new Queue()
    this.processing = false
    this.preview = R.propOr(false, 'preview', this.params)
    this.recordUuid = R.prop('recordUuid', this.params)
    this.recordUpdater = new RecordUpdater(this.preview)
  }

  async getSurvey (tx) {
    if (!this.survey) {
      const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, this.preview, true, false, tx)

      // if in preview mode, unpublished dependencies have not been stored in the db, so we need to build them
      let dependencyGraph = this.preview
        ? surveyDependencyGraph.buildGraph(surveyDb)
        : await SurveyManager.fetchDepedencies(this.surveyId)

      this.survey = Survey.assocDependencyGraph(dependencyGraph)(surveyDb)
    }

    return this.survey
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
    if (!isMainThread)
      this.postMessage({ type, content })
  }

  async processMessage (msg) {
    await db.tx(async t => {

      const user = this.getUser()
      const survey = await this.getSurvey(t)

      let updatedNodes = null

      // 1. update node
      switch (msg.type) {
        case messageTypes.createRecord:
          updatedNodes = await this.recordUpdater.createRecord(user, survey, msg.record, t)
          break
        case messageTypes.persistNode:
          updatedNodes = await this.recordUpdater.persistNode(user, survey, msg.node, t)
          break
        case messageTypes.deleteNode:
          updatedNodes = await this.recordUpdater.deleteNode(user, survey, msg.nodeUuid, t)
          break
      }
      this._postMessage(WebSocketEvents.nodesUpdate, updatedNodes)

      // 2. update dependent nodes
      const updatedDependentNodes = await DependentNodesUpdater.updateNodes(survey, updatedNodes, t)
      this._postMessage(WebSocketEvents.nodesUpdate, updatedDependentNodes)

      // 3. update node validations
      const validations = await RecordValidator.validateNodes(survey, this.recordUuid, updatedNodes, t)
      this._postMessage(WebSocketEvents.nodeValidationsUpdate, validations)

      // 4. update survey rdb
      if (!this.preview) {
        const nodeDefs = toUuidIndexedObj(
          Survey.getNodeDefsByUuids(Node.getNodeDefUuids(updatedNodes))(survey)
        )
        await SurveyRdbManager.updateTableNodes(Survey.getSurveyInfo(survey), nodeDefs, updatedNodes, t)
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