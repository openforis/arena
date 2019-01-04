const R = require('ramda')
const Promise = require('bluebird')

const SurveyUtils = require('../../../../common/survey/surveyUtils')
const NodeDef = require('../../../../common/survey/nodeDef')
const Node = require('../../../../common/record/node')

const RecordRepository = require('../../../record/recordRepository')
const NodeDefRepository = require('../../../nodeDef/nodeDefRepository')
const NodeRepository = require('../../../record/nodeRepository')

const ActivityLog = require('../../../activityLog/activityLogger')

//==========
// Exported methods
//==========

const createRecord = async (user, surveyId, recordToCreate, t) => {

  const record = await RecordRepository.insertRecord(surveyId, recordToCreate, t)
  const {uuid: recordUuid} = record

  await ActivityLog.log(user, surveyId, ActivityLog.type.recordCreate, recordToCreate, t)

  const rootNodeDef = await NodeDefRepository.fetchRootNodeDef(surveyId, false, t)
  const rootNode = Node.newNode(rootNodeDef.uuid, recordUuid)

  return await persistNode(user, surveyId, rootNode, t)
}

const persistNode = async (user, surveyId, node, t) => {
  const {uuid} = node
  const nodeDb = await NodeRepository.fetchNodeByUuid(surveyId, uuid, t)

  if (nodeDb) {
    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeValueUpdate, R.pick(['uuid', 'value'], node), t)
    return await updateNodeValue(surveyId, uuid, Node.getNodeValue(node), t)
  } else {
    return await insertNode(surveyId, node, user, t)
  }
}

const deleteNode = async (user, surveyId, nodeUuid, t) => {
  const node = await NodeRepository.deleteNode(surveyId, nodeUuid, t)

  await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDelete, {nodeUuid}, t)

  return await onNodeUpdate(surveyId, node, t)
}

//==========
// Internal methods
//==========

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

// ==== CREATE
const insertNode = async (surveyId, node, user, t) => {
  const nodeDef = await NodeDefRepository.fetchNodeDefByUuid(surveyId, Node.getNodeDefUuid(node), t)
  const nodesToReturn = await insertNodeRecursively(surveyId, nodeDef, node, user, t)
  return await assocParentNode(surveyId, node, nodesToReturn, t)
}

const insertNodeRecursively = async (surveyId, nodeDef, nodeToInsert, user, t) => {
  await ActivityLog.log(user, surveyId, ActivityLog.type.nodeCreate, nodeToInsert, t)

  // insert node
  const node = await NodeRepository.insertNode(surveyId, nodeToInsert, t)

  // add children if entity
  const childDefs = NodeDef.isNodeDefEntity(nodeDef)
    ? await NodeDefRepository.fetchNodeDefsByParentUuid(surveyId, nodeDef.uuid)
    : []
  // insert only child single nodes
  const childNodes = R.mergeAll(
    await Promise.all(
      childDefs
        .filter(NodeDef.isNodeDefSingle)
        .map(async childDef =>
        await insertNodeRecursively(surveyId, childDef, Node.newNode(childDef.uuid, node.recordUuid, node.uuid), user, t)
      )
    )
  )
  return R.mergeLeft({[node.uuid]: node}, childNodes)
}

// ==== UPDATE

const updateNodeValue = async (surveyId, nodeUuid, value, t) => {
  const node = await NodeRepository.updateNode(surveyId, nodeUuid, value, t)
  return await onNodeUpdate(surveyId, node, t)
}

const onNodeUpdate = async (surveyId, node, t) => {
  //delete dependent code nodes
  const descendantCodes = await NodeRepository.fetchDescendantNodesByCodeUuid(surveyId, node.recordUuid, node.uuid)
  const nodesToReturn = await Promise.all(
    descendantCodes.map(async nodeCode => await NodeRepository.deleteNode(surveyId, nodeCode.uuid, t))
  )
  return await assocParentNode(surveyId, node, SurveyUtils.toUuidIndexedObj(nodesToReturn), t)
}

module.exports = {
  createRecord,
  persistNode,
  deleteNode,
}