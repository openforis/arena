const db = require('../db/db')

const {getSurveyDefaultStep} = require('../../common/survey/survey')

const surveyDataSchemaPrefix = 'of_arena_survey_'

const schema = surveyId => surveyDataSchemaPrefix + surveyId

// ============== CREATE

const createRecord = async (user, survey) => db.tx(
  async t => {
    const {id: recordId} = await t.one(`
      INSERT INTO ${schema(survey.id)}.record (owner_id, survey_id, step)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [user.id, survey.id, getSurveyDefaultStep(survey)])

    return await fetchRecordById(survey.id, recordId, t)
  }
)

// ============== READ

const fetchRecordById = async (surveyId, recordId, client = db) =>
  await client.one(
    `SELECT * FROM ${schema(surveyId)}.record WHERE id = $1`,
    [recordId]
  )

const fetchRecordNodes = async (surveyId, recordId, client = db) =>
  await client.one(
    `SELECT * FROM ${schema(surveyId)}.nodes WHERE record_id = $1 
     ORDER BY id`,
    [recordId]
  )

module.exports = {
  // CREATE
  createRecord,

  // READ
  fetchRecordById,
  fetchRecordNodes,

  //UPDATE

}