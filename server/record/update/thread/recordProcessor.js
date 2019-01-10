const R = require('ramda')
const Promise = require('bluebird')

const SurveyUtils = require('../../../../common/survey/surveyUtils')
const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Node = require('../../../../common/record/node')
const Record = require('../../../../common/record/record')

const RecordRepository = require('../../../record/recordRepository')
const NodeRepository = require('../../../record/nodeRepository')

const ActivityLog = require('../../../activityLog/activityLogger')

class RecordProcessor {

  constructor (preview) {
    this.preview = preview
  }

  isPreview () {
    return this.preview
  }

  async logActivity () {
    if (!this.isPreview())
      await R.apply(ActivityLog.log, arguments)
  }

  async createRecord (user, survey, recordToCreate, t) {
    const surveyId = Survey.getId(survey)

    await RecordRepository.insertRecord(surveyId, recordToCreate, t)
    await this.logActivity(user, surveyId, ActivityLog.type.recordCreate, recordToCreate, t)

    const rootNodeDef = Survey.getRootNodeDef(survey)
    const rootNode = Node.newNode(NodeDef.getUuid(rootNodeDef), Record.getUuid(recordToCreate))
    return await this.persistNode(user, survey, rootNode, t)
  }

  async persistNode (user, survey, node, t) {
    const {uuid} = node

    const surveyId = Survey.getId(survey)

    const nodeDb = await NodeRepository.fetchNodeByUuid(surveyId, uuid, t)

    if (nodeDb) {
      // update
      await this.logActivity(user, surveyId, ActivityLog.type.nodeValueUpdate, R.pick(['uuid', 'value'], node), t)
      return await this._updateNodeValue(surveyId, uuid, Node.getNodeValue(node), t)
    } else {
      // create
      return await this._insertNode(survey, node, user, t)
    }
  }

  async deleteNode (user, survey, nodeUuid, t) {
    const surveyId = Survey.getId(survey)

    const node = await NodeRepository.deleteNode(surveyId, nodeUuid, t)

    await this.logActivity(user, surveyId, ActivityLog.type.nodeDelete, {nodeUuid}, t)

    return await this._onNodeUpdate(surveyId, node, t)
  }

  //==========
  // Internal methods
  //==========

  // ==== CREATE
  async _insertNode (survey, node, user, t) {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    const nodesToReturn = await this._insertNodeRecursively(survey, nodeDef, node, user, t)
    return await assocParentNode(Survey.getId(survey), node, nodesToReturn, t)
  }

  async _insertNodeRecursively (survey, nodeDef, nodeToInsert, user, t) {
    const surveyId = Survey.getId(survey)
    await this.logActivity(user, surveyId, ActivityLog.type.nodeCreate, nodeToInsert, t)

    // insert node
    const node = await NodeRepository.insertNode(surveyId, nodeToInsert, t)

    // add children if entity
    const childDefs = NodeDef.isNodeDefEntity(nodeDef)
      ? Survey.getNodeDefChildren(nodeDef)(survey)
      : []

    // insert only child single entities
    const childNodes = R.mergeAll(
      await Promise.all(
        childDefs
          .filter(NodeDef.isNodeDefSingle)
          .map(async childDef =>
            await this._insertNodeRecursively(survey, childDef, Node.newNode(childDef.uuid, node.recordUuid, node.uuid), user, t)
          )
      )
    )
    return R.mergeLeft({[node.uuid]: node}, childNodes)
  }

  // ==== UPDATE

  async _updateNodeValue (surveyId, nodeUuid, value, t) {
    const node = await NodeRepository.updateNode(surveyId, nodeUuid, value, t)
    return await this._onNodeUpdate(surveyId, node, t)
  }

  async _onNodeUpdate (surveyId, node, t) {
    // delete dependent code nodes
    const descendantCodes = await NodeRepository.fetchDescendantNodesByCodeUuid(surveyId, node.recordUuid, node.uuid, t)
    const nodesToReturn = await Promise.all(
      descendantCodes.map(async nodeCode => await NodeRepository.deleteNode(surveyId, nodeCode.uuid, t))
    )
    return await assocParentNode(surveyId, node, SurveyUtils.toUuidIndexedObj(nodesToReturn), t)
  }
}

//always assoc parentNode, used in surveyRdbManager.updateTableNodes
const assocParentNode = async (surveyId, node, nodes, t) => {
  const parentUuid = Node.getParentUuid(node)
  const parentNode = parentUuid && !nodes[parentUuid] ? await NodeRepository.fetchNodeByUuid(surveyId, parentUuid, t) : null
  return R.mergeRight({
      [node.uuid]: node,
      ...parentNode ? {[parentNode.uuid]: parentNode} : {}
    },
    nodes
  )
}

module.exports = RecordProcessor