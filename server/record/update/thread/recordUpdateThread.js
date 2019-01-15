const {isMainThread} = require('worker_threads')

const R = require('ramda')

const db = require('../../../db/db')

const RecordProcessor = require('./recordProcessor')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')

const SurveyManager = require('../../../survey/surveyManager')
const surveyDependencyGraph = require('../../../survey/surveyDependenchyGraph')
const SurveyRdbManager = require('../../../surveyRdb/surveyRdbManager')

const Survey = require('../../../../common/survey/survey')
const Node = require('../../../../common/record/node')
const Queue = require('../../../../common/queue')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')

class RecordUpdateThread extends Thread {

  constructor (paramsObj) {
    super(paramsObj)

    this.queue = new Queue()
    this.processing = false
    this.preview = R.propOr(false, 'preview', this.params)
    this.processor = new RecordProcessor(this._postMessage.bind(this), this.preview)
  }

  async getSurvey (tx) {
    if (!this.survey) {
      const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, this.preview, true, false, tx)

      // if in preview mode, unpublished dependencies have not been stored in the db, so we need to build them
      let dependencyGraph = this.preview ?
        surveyDependencyGraph.buildGraph(surveyDb)
        :
        await SurveyManager.fetchDepedencies(this.surveyId)

      this.survey = R.assoc('dependencyGraph', dependencyGraph, surveyDb)
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

  _postMessage (msg) {
    if (!isMainThread)
      this.postMessage(msg)
  }

  async processMessage (msg) {
    await db.tx(async t => {

      const user = this.getUser()
      const survey = await this.getSurvey(t)

      let updatedNodes = null

      // 1. update node and dependent nodes
      switch (msg.type) {
        case messageTypes.createRecord:
          updatedNodes = await this.processor.createRecord(user, survey, msg.record, t)
          break
        case messageTypes.persistNode:
          updatedNodes = await this.processor.persistNode(user, survey, msg.node, t)
          break
        case messageTypes.deleteNode:
          updatedNodes = await this.processor.deleteNode(user, survey, msg.nodeUuid, t)
          break
      }

      //2. update survey rdb
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