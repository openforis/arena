const R = require('ramda')
const Promise = require('bluebird')

const SurveyUtils = require('../../../../common/survey/surveyUtils')
const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Node = require('../../../../common/record/node')
const Record = require('../../../../common/record/record')

const NodeRepository = require('./nodeRepository')

const ActivityLog = require('../../activityLog/activityLogger')

//always assoc parentNode, used in surveyRdbManager.updateTableNodes
const assocParentNode = (surveyId, record, node, nodes) => {
  const parentNode = Record.getParentNode(node)(record)
  const parentNodeObj = parentNode ? { [Node.getUuid(parentNode)]: parentNode } : {}
  const nodeObj = { [Node.getUuid(node)]: node }

  return R.mergeRight({ ...nodeObj, ...parentNodeObj }, nodes)
}

const persistNode = async (user, survey, record, node, t) => {
  const nodeUuid = Node.getUuid(node)

  const existingNode = Record.getNodeByUuid(nodeUuid)(record)

  if (existingNode) {
    // update
    const surveyId = Survey.getId(survey)
    if (!Record.isPreview(record))
      await ActivityLog.log(user, surveyId, ActivityLog.type.nodeValueUpdate, R.pick(['uuid', 'value'], node), t)

    const nodeValue = Node.getNodeValue(node)
    const meta = { [Node.metaKeys.defaultValue]: false }
    const nodeUpdate = await NodeRepository.updateNode(surveyId, nodeUuid, nodeValue, meta, t)

    record = Record.assocNode(nodeUpdate)(record)

    return await _onNodeUpdate(survey, record, nodeUpdate, t)

  } else {
    // create
    return await insertNode(survey, record, node, user, t)
  }
}

// ==== CREATE
const insertNode = async (survey, record, node, user, t) => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  // If it's a code, don't insert if it has been inserted already (by another user)
  if (NodeDef.isNodeDefCode(nodeDef)) {
    const siblings = Record.getNodeSiblingsByDefUuid(node, nodeDefUuid)(record)
    if (R.any(sibling => R.equals(Node.getNodeValue(sibling), Node.getNodeValue(node)))(siblings)) {
      return {}
    }
  }

  const nodesToReturn = await _insertNodeRecursively(survey, nodeDef, record, node, user, t)

  record = Record.assocNodes(nodesToReturn)(record)

  return assocParentNode(Survey.getId(survey), record, node, nodesToReturn)
}

const _insertNodeRecursively = async (survey, nodeDef, record, nodeToInsert, user, t) => {
  const surveyId = Survey.getId(survey)

  if (!Record.isPreview(record))
    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeCreate, nodeToInsert, t)

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
            const childNode = Node.newNode(NodeDef.getUuid(childDef), Node.getRecordUuid(node), node)
            return await _insertNodeRecursively(survey, childDef, record, childNode, user, t)
          }
        )
    )
  )
  return R.mergeLeft({ [Node.getUuid(node)]: node }, childNodes)
}

//==== UPDATE

const _onNodeUpdate = async (survey, record, node, t) => {
  // TODO check if it should be removed
  const surveyId = Survey.getId(survey)

  let updatedNodes = {
    [Node.getUuid(node)]: node
  }

  // delete dependent code nodes
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  if (NodeDef.isNodeDefCode(nodeDef)) {
    const dependentCodes = Record.getDependentCodeAttributes(node)(record)
    if (!R.isEmpty(dependentCodes)) {
      const deletedNodesArray = await Promise.all(
        dependentCodes.map(async nodeCode => await NodeRepository.deleteNode(surveyId, Node.getUuid(nodeCode), t))
      )
      updatedNodes = R.mergeRight(updatedNodes, SurveyUtils.toUuidIndexedObj(deletedNodesArray))
    }
  }

  record = Record.assocNodes(updatedNodes)(record)

  return assocParentNode(surveyId, record, node, updatedNodes)
}

//==== DELETE

const deleteNode = async (user, survey, record, nodeUuid, t) => {
  const surveyId = Survey.getId(survey)

  const node = await NodeRepository.deleteNode(surveyId, nodeUuid, t)

  record = Record.assocNode(node)(record)

  if (!Record.isPreview(record))
    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDelete, { nodeUuid }, t)

  return await _onNodeUpdate(survey, record, node, t)
}

module.exports = {
  insertNode,
  persistNode,
  deleteNode,
}