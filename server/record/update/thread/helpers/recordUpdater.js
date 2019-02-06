const R = require('ramda')
const Promise = require('bluebird')

const SurveyUtils = require('../../../../../common/survey/surveyUtils')
const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const Node = require('../../../../../common/record/node')
const Record = require('../../../../../common/record/record')

const RecordRepository = require('../../../recordRepository')
const NodeRepository = require('../../../nodeRepository')

const ActivityLog = require('../../../../activityLog/activityLogger')

class RecordUpdater {

  constructor (preview = false) {
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

    const record = await RecordRepository.insertRecord(surveyId, recordToCreate, t)
    await this.logActivity(user, surveyId, ActivityLog.type.recordCreate, recordToCreate, t)

    const rootNodeDef = Survey.getRootNodeDef(survey)
    const rootNode = Node.newNode(NodeDef.getUuid(rootNodeDef), Record.getUuid(recordToCreate))

    return await this.persistNode(user, survey, record, rootNode, t)
  }

  async persistNode (user, survey, record, node, t) {
    const uuid = Node.getUuid(node)

    const existingNode = Record.getNodeByUuid(uuid)(record)

    if (existingNode) {
      // update
      await this.logActivity(user, Survey.getId(survey), ActivityLog.type.nodeValueUpdate, R.pick(['uuid', 'value'], node), t)
      return await this._updateNodeValue(survey, record, uuid, Node.getNodeValue(node), t)
    } else {
      // create
      return await this._insertNode(survey, record, node, user, t)
    }
  }

  async deleteNode (user, survey, record, nodeUuid, t) {
    const surveyId = Survey.getId(survey)

    const node = await NodeRepository.deleteNode(surveyId, nodeUuid, t)

    record = Record.assocNode(node)(record)

    await this.logActivity(user, surveyId, ActivityLog.type.nodeDelete, { nodeUuid }, t)

    return await this._onNodeUpdate(survey, record, node, t)
  }

  //==========
  // Internal methods
  //==========

  // ==== CREATE
  async _insertNode (survey, record, node, user, t) {
    const nodeDefUuid = Node.getNodeDefUuid(node)
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

    // If it's a code, don't insert if it has been inserted already (by another user)
    if (NodeDef.isNodeDefCode(nodeDef)) {
      const siblings = Record.getNodeSiblingsByDefUuid(node, nodeDefUuid)(record)
      if (R.any(sibling => R.equals(Node.getNodeValue(sibling), Node.getNodeValue(node)))(siblings)) {
        return {}
      }
    }

    const nodesToReturn = await this._insertNodeRecursively(survey, nodeDef, record, node, user, t)

    record = Record.assocNodes(nodesToReturn)(record)

    return await assocParentNode(Survey.getId(survey), record, node, nodesToReturn)
  }

  async _insertNodeRecursively (survey, nodeDef, record, nodeToInsert, user, t) {
    const surveyId = Survey.getId(survey)
    await this.logActivity(user, surveyId, ActivityLog.type.nodeCreate, nodeToInsert, t)

    // insert node
    const node = await NodeRepository.insertNode(surveyId, nodeToInsert, t)

    record = Record.assocNode(node)(record)

    // add children if entity
    const childDefs = NodeDef.isNodeDefEntity(nodeDef)
      ? Survey.getNodeDefChildren(nodeDef)(survey)
      : []

    // insert only child single nodes
    const childNodes = R.mergeAll(
      await Promise.all(
        childDefs
          .filter(NodeDef.isNodeDefSingle)
          .map(async childDef => {
              const childNode = Node.newNode(NodeDef.getUuid(childDef), Node.getRecordUuid(node), Node.getUuid(node))
              return await this._insertNodeRecursively(survey, childDef, record, childNode, user, t)
            }
          )
      )
    )
    return R.mergeLeft({ [Node.getUuid(node)]: node }, childNodes)
  }

  // ==== UPDATE

  async _updateNodeValue (survey, record, nodeUuid, value, t) {
    const node = await NodeRepository.updateNode(Survey.getId(survey), nodeUuid, value, { [Node.metaKeys.defaultValue]: false }, t)
    record = Record.assocNode(node)(record)
    return await this._onNodeUpdate(survey, record, node, t)
  }

  async _onNodeUpdate (survey, record, node, t) {
    // TODO check if it should be removed
    const surveyId = Survey.getId(survey)

    let updatedNodes = {
      [Node.getUuid(node)]: node
    }

    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    if (NodeDef.isNodeDefCode(nodeDef)) {
      // delete dependent code nodes

      const dependentCodes = Record.getDependentCodeAttributes(node)(record)

      if (!R.isEmpty(dependentCodes)) {

        const deletedNodesArray = await Promise.all(
          dependentCodes.map(async nodeCode => await NodeRepository.deleteNode(surveyId, Node.getUuid(nodeCode), t))
        )
        updatedNodes = R.mergeRight(updatedNodes, SurveyUtils.toUuidIndexedObj(deletedNodesArray))
      }
    }
    record = Record.assocNodes(updatedNodes)(record)
    return await assocParentNode(surveyId, record, node, updatedNodes)
  }
}

//always assoc parentNode, used in surveyRdbManager.updateTableNodes
const assocParentNode = async (surveyId, record, node, nodes) => {
  const parentNode = Record.getParentNode(node)(record)

  return R.mergeRight({
      [Node.getUuid(node)]: node,
      ...parentNode ? { [Node.getUuid(parentNode)]: parentNode } : {}
    },
    nodes
  )
}

module.exports = RecordUpdater