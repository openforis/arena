const R = require('ramda')
const Promise = require('bluebird')

const SurveyUtils = require('../../../../common/survey/surveyUtils')
const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

const SurveyManager = require('../../../survey/surveyManager')

const RecordRepository = require('../../../record/recordRepository')
const NodeDefRepository = require('../../../nodeDef/nodeDefRepository')
const NodeRepository = require('../../../record/nodeRepository')

const {dependencyTypes} = require('../../../survey/surveyDependenchyGraph')

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

  // find dependent nodes
  const dependencies = await SurveyManager.fetchDepedenciesByNodeDefUuid(surveyId, dependencyTypes.defaultValues, nodeDef.uuid, t)

  if (dependencies) {
    const dependentDefs = await NodeDefRepository.fetchNodeDefsByUuid(surveyId, dependencies, false, t)
    for (const dependentDef of dependentDefs) {
      const commonParentDefUuid = R.last(R.intersection(nodeDef.meta.h, dependentDef.meta.h))
      const commonParentNode = await NodeRepository.fetchAncestorByNodeDefUuid(surveyId, node.uuid, commonParentDefUuid, t)

      const dependants = await NodeRepository.fetchDescendantNodesByNodeDefUuid(surveyId, Node.getRecordUuid(node), commonParentNode.uuid, dependentDef.uuid, t)

      console.log(dependants)
    }
  }


  // add children if entity
  const childDefs = NodeDef.isNodeDefEntity(nodeDef)
    ? await NodeDefRepository.fetchNodeDefsByParentUuid(surveyId, nodeDef.uuid)
    : []
  // insert only child single entities
  const childNodes = R.mergeAll(
    await Promise.all(
      childDefs
        .filter(NodeDef.isNodeDefSingleEntity)
        .map(async childDef =>
          await insertNodeRecursively(surveyId, childDef, Node.newNode(childDef.uuid, node.recordUuid, node.uuid), user, t)
        )
    )
  )
  return R.mergeLeft({[node.uuid]: node}, childNodes)
}

const findDescendants = (record, parentNode, descendantDefsUuids) => {
  const descendants = []

  const children = Record.getNodeChildrenByDefUuid(parentNode, R.head(descendantDefsUuids))(record)
  if (R.length(descendantDefsUuids) === 1) {
    return children
  } else {
    for (const child of children) {
      descendants.push.apply(findDescendants(record, child, R.takeLast(descendantDefsUuids.length - 1, descendantDefsUuids)))
    }
  }
  return descendants
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