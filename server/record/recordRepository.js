const camelize = require('camelize')
const R = require('ramda')
const db = require('../db/db')

const {createRootNode} = require('../../common/record/record')
const {getSurveyDefaultStep} = require('../../common/survey/survey')
const {fetchNodeDefsBySurveyId} = require('../nodeDef/nodeDefRepository')

const surveyDataSchemaPrefix = 'of_arena_survey_'

const schema = surveyId => surveyDataSchemaPrefix + surveyId

const dbTransformCallback = r =>
  r ? camelize(r)
  : null

// ============== CREATE

const createRecord = async (user, survey, client = db) => client.tx(
  async tx => {
    const {id: recordId} = await tx.one(`
      INSERT INTO ${schema(survey.id)}.record (owner_id, step)
      VALUES ($1, $2)
      RETURNING id
    `, [user.id, getSurveyDefaultStep(survey)])

    const nodeDefs = await fetchNodeDefsBySurveyId(survey.id, client)
    const rootNodeDef = R.find(n => n.parentId === null)(nodeDefs)

    const rootNode = createRootNode(recordId, rootNodeDef.id)
    await insertNode(survey.id, rootNode, tx)

    return await fetchRecordById(survey.id, recordId, tx)
  }
)

const insertNode = async (surveyId, node, client = db) => {
  const {id: nodeId} = await client.one(`
    INSERT INTO ${schema(surveyId)}.node (record_id, parent_id, node_def_id, value)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [node.recordId, node.parentId, node.nodeDefId, node.value])

  return fetchNodeById(surveyId, nodeId, client)
}

// ============== READ

const fetchRecordById = async (surveyId, recordId, client = db) => {
  const record = await client.one(
    `SELECT * FROM ${schema(surveyId)}.record WHERE id = $1`,
    [recordId],
    r => dbTransformCallback(r)
  )
  record.nodes = await fetchRecordNodes(surveyId, record.id, client)
  return record
}

const fetchRecordNodes = async (surveyId, recordId, client = db) =>
  await client.map(
    `SELECT * FROM ${schema(surveyId)}.node WHERE record_id = $1 
     ORDER BY parent_id, id`,
    [recordId],
    r => dbTransformCallback(r)
  )

const fetchNodeById = async (surveyId, nodeId, client = db) =>
  await client.one(
    `SELECT * FROM ${schema(surveyId)}.node WHERE id = $1`,
    [nodeId],
    r => dbTransformCallback(r)
  )

module.exports = {
  // CREATE
  createRecord,

  // READ
  fetchRecordById,
  fetchRecordNodes,

  //UPDATE

}