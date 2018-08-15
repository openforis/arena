const db = require('../db/db')

const {getSurveyDefaultStep} = require('../../common/survey/survey')

// ============== CREATE

const createRecord = async (user, survey) => db.tx(
  async t => {
    const {id: recordId} = await t.one(`
      INSERT INTO record (owner_id, survey_id, step)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [user.id, survey.id, getSurveyDefaultStep(survey)])

    return await getRecordById(recordId, t)
  }
)

// ============== READ

const getRecordById = async (recordId, client = db) =>
  await client.one(
    `SELECT * FROM record WHERE id = $1`,
    [recordId]
  )

module.exports = {
  // CREATE
  createRecord,

  // READ
  getRecordById,

  //UPDATE

}