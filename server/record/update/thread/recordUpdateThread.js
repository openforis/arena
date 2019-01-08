const {isMainThread} = require('worker_threads')

const R = require('ramda')

const db = require('../../../db/db')

const RecordProcessor = require('./recordProcessor')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')

const SurveyManager = require('../../../survey/surveyManager')
const NodeDefManager = require('../../../nodeDef/nodeDefManager')
const SurveyRdbManager = require('../../../surveyRdb/surveyRdbManager')

const NodeRepository = require('../../../record/nodeRepository')

const Survey = require('../../../../common/survey/survey')
const Node = require('../../../../common/record/node')
const Queue = require('../../../../common/queue')

const DependentNodesUpdater = require('./dependentNodesUpdater')

class RecordUpdateThread extends Thread {

  constructor (params) {
    super(params)
    this.queue = new Queue()
    this.processing = false

    // init survey
    if (this.params.surveyId) {
      SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.params.surveyId, false, true, false)
        .then(survey => {
          this.survey = survey

          /*
          NodeRepository methods needed:
          updateNode, updateChildrenApplicability, fetchNodeByUuid, fetchAncestorByNodeDefUuid, fetchDescendantNodesByNodeDefUuid, fetchChildNodesByNodeDefUuid
           */
          this.dependentNodesUpdater = new DependentNodesUpdater(this.survey, NodeRepository, bindNode)
        })
    }
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
    await db.tx(async t => {
      const {user, surveyId} = msg

      let nodes = null

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

      const updatedDependentNodes = this.dependentNodesUpdater
        ? await this.dependentNodesUpdater.updateDependentNodes(user, nodes, t)
        : {}

      if (!R.isEmpty(updatedDependentNodes))
        this.postMessage(updatedDependentNodes)

      const allUpdatedNodes = R.mergeRight(nodes, updatedDependentNodes)

      //update rdb data tables
      const nodeDefs = await NodeDefManager.fetchNodeDefsByUuid(surveyId, Node.getNodeDefUuids(allUpdatedNodes), false, false, t)
      await SurveyRdbManager.updateTableNodes(Survey.getSurveyInfo(this.survey), nodeDefs, allUpdatedNodes, t)
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