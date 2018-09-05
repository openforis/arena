const R = require('ramda')
const Promise = require('bluebird')

const db = require('../db/db')

const {fetchNodeDefsBySurveyId, fetchNodeDefsByParentId} = require('../nodeDef/nodeDefRepository')
const {isNodeDefSingleEntity} = require('../../common/survey/nodeDef')

const {insertRecord} = require('../record/recordRepository')
const {newNode} = require('../../common/record/node')

const {insertNode, updateNode, deleteNode: deleteNodeRepos} = require('../record/nodeRepository')

// const mapNodes = R.groupBy(R.prop('id'))

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

      const nodeDefs = await fetchNodeDefsBySurveyId(surveyId)
      //TODO use getRootNodeDef from common/nodeDef after refactor
      const rootNodeDef = R.find(n => n.parentId === null)(nodeDefs)

      const nodes = await createNode(rootNodeDef, newNode(rootNodeDef.id, recordId), t)

      return R.assoc('nodes', nodes, record)
    }
  )

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
          async childDef => await createNode(childDef, newNode(childDef.id, node.recordId, node.id), client)
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
const updateNodeValue = async (surveyId, recordId, nodeId, value) => {
  const node = await updateNode(surveyId, nodeId, value)

  return {[node.uuid]: node}
}
/**
 * ===================
 * DELETE
 * ===================
 */

const deleteNode = async (surveyId, nodeId) => {
  await deleteNodeRepos(surveyId, nodeId)

  return {}
}

module.exports = {
  //==== CREATE
  createRecord,
  createNode,
  //==== READ
  //==== UPDATE
  updateNodeValue,
  //==== DELETE
  deleteNode,
}