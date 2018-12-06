const R = require('ramda')
const Promise = require('bluebird')

const db = require('../../../db/db')

const NodeDef = require('../../../../common/survey/nodeDef')
const Node = require('../../../../common/record/node')
const RecordRepository = require('../../../record/recordRepository')
const NodeDefRepository = require('../../../nodeDef/nodeDefRepository')
const NodeRepository = require('../../../record/nodeRepository')

const {logActivity, activityType} = require('../../../activityLog/activityLogger')

const createRecord = async(user, recordToCreate, client = db) => {
  const record = await RecordRepository.insertRecord(recordToCreate, client)
  const {surveyId, id: recordId} = record

  const rootNodeDef = await NodeDefRepository.fetchRootNodeDef(surveyId, false, client)
  const rootNode = Node.newNode(rootNodeDef.uuid, recordId)

  return persistNode(user, surveyId, rootNode)
}

const persistNode = async (user, surveyId, node, client = db) => {
  const {uuid} = node

  return await client.tx(async t => {
    const nodeDb = await NodeRepository.fetchNodeByUuid(surveyId, uuid, t)

    if (nodeDb) {
      await logActivity(user, surveyId, activityType.record.nodeUpdateValue, R.pick(['uuid', 'value'], node), t)
      return await updateNodeValue(surveyId, uuid, Node.getNodeValue(node), t)
    } else {
      await logActivity(user, surveyId, activityType.record.nodeCreate, node, t)
      return await createNode(surveyId, await NodeDefRepository.fetchNodeDefByUuid(surveyId, Node.getNodeDefUuid(node)), node, t)
    }
  })
}

/**
 * Create a new node, and recursively creates inner nodes
 *
 */
const createNode = async (surveyId, nodeDef, nodeToInsert, client = db) => {

  // insert node
  const node = await NodeRepository.insertNode(surveyId, nodeToInsert, client)

  // add children if entity
  const childDefs = NodeDef.isNodeDefEntity(nodeDef)
    ? await NodeDefRepository.fetchNodeDefsByParentUuid(surveyId, nodeDef.uuid)
    : []

  // insert only child single entities
  const childNodes = R.mergeAll(
    await Promise.all(
      childDefs
        .filter(NodeDef.isNodeDefSingleEntity)
        .map(
          async childDef => await createNode(surveyId, childDef, Node.newNode(childDef.uuid, node.recordId, node.uuid), null, client)
        )
    )
  )

  return R.mergeLeft({[node.uuid]: node}, childNodes)
}

/**
 * Update a node value
 *
 */
const updateNodeValue = async (surveyId, nodeUuid, value, client = db) =>
  await client.tx(async t => {
    const node = await NodeRepository.updateNode(surveyId, nodeUuid, value, client)

    return await onNodeUpdate(surveyId, node, t)
  })

/**
 * Delete a node
 *
 */
const deleteNode = async (user, surveyId, nodeUuid, client = db) =>
  await client.tx(async t => {
    const node = await deleteNodeInternal(surveyId, nodeUuid, t)

    await logActivity(user, surveyId, activityType.record.nodeDelete, {nodeUuid}, t)

    return await onNodeUpdate(surveyId, node, t)
  })

const onNodeUpdate = async (surveyId, node, client = db) => {
  //delete dependent code nodes
  const descendantCodes = await NodeRepository.fetchDescendantNodesByCodeUuid(surveyId, node.recordId, node.uuid)

  const clearedDependentCodeAttributes = await Promise.all(
    descendantCodes.map(async nodeCode => await deleteNodeInternal(surveyId, nodeCode.uuid, client))
  )

  return R.mergeLeft({[node.uuid]: node}, R.mergeAll(clearedDependentCodeAttributes))
}

const deleteNodeInternal = async (surveyId, nodeUuid, client) => {
  const node = await NodeRepository.deleteNode(surveyId, nodeUuid, client)
  return {...node, deleted: true, value: {}}
}

module.exports = {
  createRecord,
  persistNode,
  deleteNode,
}