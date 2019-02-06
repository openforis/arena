const { isMainThread } = require('worker_threads')

const R = require('ramda')

const db = require('../../../db/db')

const RecordUpdater = require('./helpers/recordUpdater')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')

const SurveyManager = require('../../../survey/surveyManager')
const surveyDependencyGraph = require('../../../survey/surveyDependenchyGraph')
const SurveyRdbManager = require('../../../surveyRdb/surveyRdbManager')

const RecordRepository = require('../../recordRepository')
const NodeRepository = require('../../nodeRepository')

const Survey = require('../../../../common/survey/survey')
const Node = require('../../../../common/record/node')
const Record = require('../../../../common/record/record')
const Queue = require('../../../../common/queue')
const { toUuidIndexedObj } = require('../../../../common/survey/surveyUtils')

const DependentNodesUpdater = require('./helpers/dependentNodesUpdater')
const RecordValidationManager = require('../../validator/recordValidationManager')

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
        : await SurveyManager.fetchDependencies(this.surveyId)

      this.survey = Survey.assocDependencyGraph(dependencyGraph)(surveyDb)
    }

    return this.survey
  }

  async initRecord (t) {
    const recordDb = await RecordRepository.fetchRecordByUuid(this.surveyId, this.recordUuid, t)
    const nodes = await NodeRepository.fetchNodesByRecordUuid(this.surveyId, this.recordUuid, t)
    this.record = Record.assocNodes(toUuidIndexedObj(nodes))(recordDb)
  }

  async getRecord (t) {
    if (!this.record) {
      await this.initRecord(t)
    }
    return this.record
  }

  async handleNodesUpdated (updatedNodes, t) {
    const record = await this.getRecord(t)
    this._postMessage(WebSocketEvents.nodesUpdate, updatedNodes)
    this.record = Record.assocNodes(updatedNodes)(record)
  }

  async handleNodesValidationUpdated (validations, t) {
    const record = await this.getRecord(t)
    this._postMessage(WebSocketEvents.nodeValidationsUpdate, validations)
    this.record = Record.mergeNodeValidations(validations)(record)
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

      let updatedNodes = null

      // 1. create record or update node
      switch (msg.type) {
        case messageTypes.createRecord:
          updatedNodes = await this.recordUpdater.createRecord(user, survey, msg.record, t)
          break
        case messageTypes.persistNode:
          await this.initRecord(t)
          updatedNodes = await this.recordUpdater.persistNode(user, survey, this.record, msg.node, t)
          break
        case messageTypes.deleteNode:
          await this.initRecord(t)
          // If the record was already deleted (by another user) the repository delete method returns null
          updatedNodes = await this.recordUpdater.deleteNode(user, survey, this.record, msg.nodeUuid, t) || {}
          break
      }
      await this.handleNodesUpdated(updatedNodes, t)

      // 2. update dependent nodes
      const updatedDependentNodes = await DependentNodesUpdater.updateNodes(survey, this.record, updatedNodes, t)
      await this.handleNodesUpdated(updatedDependentNodes, t)

      const updatedNodesAndDependents = R.mergeDeepRight(updatedNodes, updatedDependentNodes)

      // 3. update node validations
      const validations = await RecordValidationManager.validateNodes(survey, this.record, updatedNodesAndDependents, this.preview, t)
      await this.handleNodesValidationUpdated(validations, t)

      // 4. update survey rdb
      if (!this.preview) {
        const nodeDefs = toUuidIndexedObj(
          Survey.getNodeDefsByUuids(Node.getNodeDefUuids(updatedNodesAndDependents))(survey)
        )
        await SurveyRdbManager.updateTableNodes(Survey.getSurveyInfo(survey), nodeDefs, updatedNodesAndDependents, t)
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