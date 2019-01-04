const {isMainThread} = require('worker_threads')

const R = require('ramda')

const db = require('../../../db/db')

const RecordProcessor = require('./recordProcessor')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')

const SurveyManager = require('../../../survey/surveyManager')
const NodeDefManager = require('../../../nodeDef/nodeDefManager')
const SurveyRdbManager = require('../../../surveyRdb/surveyRdbManager')

const Survey = require('../../../../common/survey/survey')
const Node = require('../../../../common/record/node')
const Queue = require('../../../../common/queue')

const DefaultValuesCalculator = require('./defaultValuesCalculator')

class RecordUpdateThread extends Thread {

  constructor (params) {
    super(params)
    this.queue = new Queue()
    this.processing = false

    // init survey
    if (this.params.surveyId)
      SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.params.surveyId, false, true, false)
        .then(survey => this.survey = survey)
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
    let nodes = null

    await db.tx(async t => {
      const {user, surveyId} = msg

      switch (msg.type) {
        case messageTypes.createRecord:
          nodes = await RecordProcessor.createRecord(user, surveyId, msg.record, t)
          break
        case messageTypes.persistNode:
          nodes = await RecordProcessor.persistNode(user, surveyId, msg.node, t)
          break
        case messageTypes.deleteNode:
          nodes = await RecordProcessor.deleteNode(user, surveyId, msg.nodeUuid, t)
          break
      }

      if (!isMainThread)
        this.postMessage(nodes)

      //default values
      const defaultValuesUpdatedNodes = await DefaultValuesCalculator.applyDefaultValues(user, this.survey, nodes, t)
      if (!R.isEmpty(defaultValuesUpdatedNodes) && !isMainThread)
        this.postMessage(defaultValuesUpdatedNodes)

      //update rdb data tables
      nodes = R.mergeRight(nodes, defaultValuesUpdatedNodes)

      const nodeDefs = await NodeDefManager.fetchNodeDefsByUuid(surveyId, Node.getNodeDefUuids(nodes), false, false, t)
      await SurveyRdbManager.updateTableNodes(Survey.getSurveyInfo(this.survey), nodeDefs, nodes, t)
    })
  }

}

const newInstance = (params) => new RecordUpdateThread(params)

if (!isMainThread)
  newInstance()

module.exports = {
  newInstance
}