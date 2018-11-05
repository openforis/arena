const R = require('ramda')
const Promise = require('bluebird')
const db = require('../db/db')

const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const Record = require('../../common/record/record')
const Node = require('../../common/record/node')

const {getSurveyById} = require('../survey/surveyRepository')
const {
  fetchNodeDef,
  fetchNodeDefsByParentId,
  fetchNodeDefsBySurveyId,
  fetchRootNodeDef
} = require('../nodeDef/nodeDefRepository')

const {insertRecord, fetchRecordById} = require('../record/recordRepository')
const {
  insertNode,
  updateNode,
  deleteNode: deleteNodeRepos,
  fetchNodeByUUID,
  fetchNodesByRecordId,
  fetchNodeFileByUUID
} = require('../record/nodeRepository')

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

      const nodes = await createNode(rootNodeDef, Node.newNode(rootNodeDef.id, recordId), null, t)

      return R.assoc('nodes', nodes, record)
    }
  )

const persistNode = async (surveyId, nodeReq, file, client = db) => {
  const {nodeDefId, value, uuid} = nodeReq

  const node = await fetchNodeByUUID(surveyId, uuid, client)

  return node
    ? await updateNodeValue(surveyId, uuid, value, file, client)
    : await createNode(await fetchNodeDef(nodeDefId), nodeReq, file, client)
}

const createNode = async (nodeDef, nodeReq, file, client = db) => {

  // insert node
  const node = await insertNode(nodeDef.surveyId, nodeReq, file ? file.data : null, client)

  // fetch children if single entity
  const childDefs = NodeDef.isNodeDefSingleEntity(nodeDef)
    ? await fetchNodeDefsByParentId(nodeDef.id)
    : []

  // insert only child single entities
  const childNodes = R.mergeAll(
    await Promise.all(
      childDefs
        .filter(NodeDef.isNodeDefSingleEntity)
        .map(
          async childDef => await createNode(childDef, Node.newNode(childDef.id, node.recordId, node.uuid), null, client)
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
const updateNodeValue = async (surveyId, nodeUUID, value, file, client = db) =>
  await client.tx(async t => {
    const node = await updateNode(surveyId, nodeUUID, value, file ? file.data : null, client)

    const survey = Survey.assocNodeDefs(
      await fetchNodeDefsBySurveyId(surveyId, false, t)
    )(await getSurveyById(surveyId, false, t))

    const recordId = Node.getNodeRecordId(node)

    const record = Record.assocNodes(
      await fetchNodesByRecordId(surveyId, recordId, t)
    )(await fetchRecordById(surveyId, recordId, t))

    return onNodeUpdate(survey, record, node, t)
  })

const resetNodeValue = async (survey, record, nodeUUID, client = db) => {
  const node = await updateNode(survey.id, nodeUUID, null, null, client)
  return onNodeUpdate(survey, record, node, client)
}

/**
 * ===================
 * DELETE
 * ===================
 */
const deleteNode = async (surveyId, nodeUUID, client = db) =>
  await client.tx(async t => {
    const node = await deleteNodeRepos(surveyId, nodeUUID, t)
    node.deleted = true

    const survey = Survey.assocNodeDefs(
      await fetchNodeDefsBySurveyId(surveyId, false, t)
    )(await getSurveyById(surveyId, false, t))

    const recordId = Node.getNodeRecordId(node)

    const record = Record.assocNodes(
      await fetchNodesByRecordId(surveyId, recordId, t)
    )(await fetchRecordById(surveyId, recordId, t))

    return onNodeUpdate(survey, record, node, t)
  })

const deleteNodeInternal = async (survey, record, nodeUUID, client = db) => {
  const node = await deleteNodeRepos(survey.id, nodeUUID, client)
  node.deleted = true
  return onNodeUpdate(survey, record, node, client)
}

const onNodeUpdate = async (survey, record, node, client = db) => {
  //delete dependent code nodes
  const dependentCodeAttributes = Record.getNodeCodeDependentAttributes(survey, node)(record)

  const clearedDependentCodeAttributes = await Promise.all(
    dependentCodeAttributes.map(async n => {
      const nDef = Survey.getNodeDefById(Node.getNodeDefId(n))(survey)
      if (NodeDef.isNodeDefMultiple(nDef)) {
        //delete node
        return await deleteNodeInternal(survey, record, n.uuid, client)
      } else {
        //reset value
        return await resetNodeValue(survey, record, n.uuid, client)
      }
    })
  )

  return R.merge({[node.uuid]: node}, R.mergeAll(clearedDependentCodeAttributes))
}

module.exports = {
  //==== CREATE
  createRecord,
  persistNode,
  // createNode,
  //==== READ
  fetchNodeFileByUUID,
  //==== UPDATE
  // updateNodeValue,
  //==== DELETE
  deleteNode,
}
