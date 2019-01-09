const {isMainThread} = require('worker_threads')

const R = require('ramda')

const db = require('../../../db/db')

const RecordProcessor = require('./recordProcessor')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')

const SurveyManager = require('../../../survey/surveyManager')
const SurveyRdbManager = require('../../../surveyRdb/surveyRdbManager')

const NodeRepository = require('../../../record/nodeRepository')

const Survey = require('../../../../common/survey/survey')
const Node = require('../../../../common/record/node')
const Queue = require('../../../../common/queue')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')

const DependentNodesUpdater = require('./dependentNodesUpdater')

class RecordUpdateThread extends Thread {

  constructor (params) {
    super(params)

    this.queue = new Queue()
    this.processing = false
    this.preview = R.propOr(false, 'preview', params)
    this.processor = new RecordProcessor(this.preview)
  }

  async getSurvey (tx) {
    if (!this.survey)
      this.survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, this.preview, true, false, tx)

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
      const {user, surveyId} = msg

      let nodes = null

      // 1. update nodes
      switch (msg.type) {
        case messageTypes.createRecord:
          nodes = await this.processor.createRecord(user, surveyId, msg.record, t)
          break
        case messageTypes.persistNode:
          nodes = await this.processor.persistNode(user, surveyId, msg.node, t)
          break
        case messageTypes.deleteNode:
          nodes = await this.processor.deleteNode(user, surveyId, msg.nodeUuid, t)
          break
      }

      this._postMessage(nodes)

      const survey = await this.getSurvey(t)

      // 2. update applicable, defaultValues of dependent nodes
      const updatedDependentNodes = await new DependentNodesUpdater(survey, NodeRepository, bindNode)
        .updateDependentNodes(user, nodes, t)

      if (!R.isEmpty(updatedDependentNodes))
        this._postMessage(updatedDependentNodes)

      const updatedNodes = R.mergeRight(nodes, updatedDependentNodes)

      //3. update survey rdb

      if (!this.preview) {
        const nodeDefs = toUuidIndexedObj(
          Survey.getNodeDefsByUuids(Node.getNodeDefUuids(updatedNodes))(survey)
        )
        await SurveyRdbManager.updateTableNodes(Survey.getSurveyInfo(survey), nodeDefs, updatedNodes, t)
      }
    })
  }
}

const bindNode = (survey, node, tx) => {
  const surveyId = Survey.getSurveyInfo(survey).id

  return {
    ...node,

    parent: async () => bindNode(survey, await NodeRepository.fetchNodeByUuid(surveyId, Node.getParentUuid(node), tx), tx),

    node: async name => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      const childDef = Survey.getNodeDefChildByName(nodeDef, name)(survey)
      const child = await NodeRepository.fetchChildNodeByNodeDefUuid(surveyId, Node.getRecordUuid(node), node.uuid, childDef.uuid, tx)
      return child ? bindNode(survey, child, tx) : null
    },

    sibling: async name => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
      const childDef = Survey.getNodeDefChildByName(parentDef, name)(survey)
      const sibling = await NodeRepository.fetchChildNodeByNodeDefUuid(surveyId, Node.getRecordUuid(node), Node.getParentUuid(node), childDef.uuid, tx)
      return sibling ? bindNode(survey, sibling, tx) : null
    }
  }
}

const newInstance = (params) => new RecordUpdateThread(params)

if (!isMainThread)
  newInstance()

module.exports = {
  newInstance
}
