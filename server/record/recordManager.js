const R = require('ramda')
const Promise = require('bluebird')

const db = require('../db/db')

const {getSurveyById} = require('../survey/surveyRepository')

const {fetchNodeDef, fetchNodeDefsBySurveyId, fetchNodeDefsByParentId} = require('../nodeDef/nodeDefRepository')
const {nodeDefType, isNodeDefEntity, isNodeDefMultiple} = require('../../common/survey/nodeDef')

const {insertRecord} = require('../record/recordRepository')
const {commandType, newNode} = require('../../common/record/record')

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

      const nodes = await createNode(rootNodeDef, recordId, null, t)

      return R.assoc('nodes', nodes, record)
    }
  )

const createNode = async (nodeDef, recordId, parentId = null, client = db) => {

  // insert node
  const node = await insertNode(nodeDef.surveyId, newNode(nodeDef.id, recordId, parentId), client)

  // insert children if single entity
  const childDefs = isNodeDefEntity(nodeDef) && !isNodeDefMultiple(nodeDef)
    ? await fetchNodeDefsByParentId(nodeDef.id)
    : []

  const childNodes = R.mergeAll(
    await Promise.all(
      childDefs.map(
        async childDef => await createNode(childDef, recordId, node.id, client)
      )
    )
  )

  return R.merge({[node.id]: node}, childNodes)
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

  return {[node.id]: node}
}
/**
 * ===================
 * DELETE
 * ===================
 */

const deleteNode = async (surveyId, nodeId) => {

}

module.exports = {
  //==== CREATE
  createRecord,
  createNode,
  //==== READ
  //==== UPDATE
  updateNodeValue,
  //==== DELETE
}