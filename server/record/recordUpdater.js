const R = require('ramda')
const Promise = require('bluebird')

const db = require('../db/db')

const {getSurveyById} = require('../survey/surveyRepository')

const {fetchNodeDef, fetchNodeDefsBySurveyId, fetchNodeDefsByParentId} = require('../nodeDef/nodeDefRepository')
const {nodeDefType, isNodeDefEntity, isNodeDefMultiple} = require('../../common/survey/nodeDef')

const {insertRecord} = require('../record/recordRepository')
const {commandType, newNode} = require('../../common/record/record')

const {insertNode, updateNode, deleteNode} = require('../record/nodeRepository')

// const mapNodes = R.groupBy(R.prop('id'))

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

  // insert children if entity
  const childDefs = isNodeDefEntity(nodeDef) && !isNodeDefMultiple(nodeDef)
    ? await fetchNodeDefsByParentId(nodeDef.id)
    : []

  const childNodes = R.isEmpty(childDefs)
    ? {}
    : R.reduce(
      async (obj, nodeDef) => R.merge(
        obj,
        await createNode(nodeDef, recordId, node.id, client)
      ),
      {},
      childDefs
    )

  return R.merge({[node.id]: node}, childNodes)
}

//
// const processUpdateNodeCommand = async (command) => {
//   const {surveyId, user, nodeId} = command
//
//   const updatedNodes = []
//
//   const node = await updateNode(surveyId, nodeId, command.value)
//
//   //history
//   await insertNodeUpdatedLog(surveyId, user, node)
//
//   updatedNodes.push(node)
//
//   //TODO evaluate dependent expressions
//   return updatedNodes
// }
//
// processDeleteNodeCommand = async (command) => {
//   const {surveyId, user, nodeId} = command
//
//   const updatedNodes = []
//
//   const node = await deleteNode(surveyId, nodeId)
//
//   //history
//   await insertNodeDeletedLog(surveyId, user, node)
//
//   //TODO evaluate dependent expressions
//   return updatedNodes
// }

module.exports = {
  //==== CREATE
  createRecord,
  createNode,
}