const R = require('ramda')
const Promise = require('bluebird')

const db = require('../db/db')

const {isNodeDefSingleEntity} = require('../../common/survey/nodeDef')
const {newNode} = require('../../common/record/node')

const {fetchRootNodeDef} = require('../survey/surveyRepository')
const {fetchNodeDef, fetchNodeDefsByParentId} = require('../nodeDef/nodeDefRepository')

const {insertRecord} = require('../record/recordRepository')
const {insertNode, updateNode, deleteNode: deleteNodeRepos, fetchNodeByUUID} = require('../record/nodeRepository')

/**
 * ===================
 * CREATE
 * ===================
 */
const createRecord = async (recordToCreate) =>
  await db.tx(
    async t => {
      const record = await insertRecord(recordToCreate, t)
      const {surveyId, id: recordId} = record

      const rootNodeDef = await fetchRootNodeDef(surveyId, false, t)

      const nodes = await createNode(rootNodeDef, newNode(rootNodeDef.id, recordId), t)

      return R.assoc('nodes', nodes, record)
    }
  )

const persistNode = async (surveyId, nodeReq, client = db) => {
  const {nodeDefId, value, uuid} = nodeReq

  const node = await fetchNodeByUUID(surveyId, uuid, client)

  return node
    ? await updateNodeValue(surveyId, uuid, value, client)
    : await createNode(await fetchNodeDef(nodeDefId), nodeReq, client)
}

const createNode = async (nodeDef, nodeReq, client = db) => {

  // insert node
  const node = await insertNode(nodeDef.surveyId, nodeReq, client)

  // fetch children if single entity
  const childDefs = isNodeDefSingleEntity(nodeDef)
    ? await fetchNodeDefsByParentId(nodeDef.id)
    : []

  // insert only child single entities
  const childNodes = R.mergeAll(
    await Promise.all(
      childDefs
        .filter(isNodeDefSingleEntity)
        .map(
          async childDef => await createNode(childDef, newNode(childDef.id, node.recordId, node.uuid), client)
        )
    )
  )

  return R.merge({[node.uuid]: node}, childNodes)
}
/**
 * ===================
 * READ
 * ===================
 */
/**
 * ===================
 * UPDATE
 * ===================
 */
const updateNodeValue = async (surveyId, nodeUUID, value, client = db) => {
  const node = await updateNode(surveyId, nodeUUID, value, client)

  return {[node.uuid]: node}
}
/**
 * ===================
 * DELETE
 * ===================
 */

const deleteNode = async (surveyId, nodeUUID) => {
  await deleteNodeRepos(surveyId, nodeUUID)

  return {}
}

module.exports = {
  //==== CREATE
  createRecord,
  persistNode,
  // createNode,
  //==== READ
  //==== UPDATE
  // updateNodeValue,
  //==== DELETE
  deleteNode,
}