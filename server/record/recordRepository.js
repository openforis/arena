const camelize = require('camelize')
const R = require('ramda')
const db = require('../db/db')

const {insertNode, fetchNodes} = require('./nodeRepository')
const {createRootNode} = require('../../common/record/record')
const {surveyDataSchema, getSurveyDefaultStep} = require('../../common/survey/survey')
const {fetchNodeDefsBySurveyId} = require('../nodeDef/nodeDefRepository')

const dbTransformCallback = r =>
  r ? camelize(r)
  : null

// ============== CREATE

const createRecord = async (user, survey, client = db) => client.tx(
  async tx => {
    const {id: recordId} = await tx.one(`
      INSERT INTO ${surveyDataSchema(survey.id)}.record (owner_id, step)
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

// ============== READ

const fetchRecordById = async (surveyId, recordId, client = db) => {
  const record = await client.one(
    `SELECT * FROM ${surveyDataSchema(surveyId)}.record WHERE id = $1`,
    [recordId],
    r => dbTransformCallback(r)
  )
  record.nodes = await fetchNodes(surveyId, record.id, client)
  return record
}

module.exports = {
  // CREATE
  createRecord,

  // READ
  fetchRecordById,

  //UPDATE
}