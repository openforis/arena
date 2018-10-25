const db = require('../db/db')
const {getSurveyDBSchema} = require('../../common/survey/survey')

const {selectDate} = require('../db/dbUtils')

const {
  defDbTransformCallback: dbTransformCallback
} = require('../../common/survey/surveyUtils')

const {
  nodeDefSelectFields,
} = require('../nodeDef/nodeDefRepository')

// ============== CREATE

const insertSurvey = async (props, userId, client = db) =>
  await client.one(`
      INSERT INTO survey (owner_id, props_draft)
      VALUES ($1, $2)
      RETURNING *
    `,
    [userId, props],
    def => dbTransformCallback(def, true)
  )

// ============== READ
const fetchAllSurveys = async (client = db) =>
  await client.map(
      `SELECT * FROM survey`,
    [],
    def => dbTransformCallback(def)
  )

const fetchUserSurveys = async (user, client = db) =>
  await client.map(`
    SELECT 
      s.*, ${selectDate('n.date_created', 'date_created')},nm.date_modified
    FROM survey s
    JOIN node_def n
      ON s.id = n.survey_id
      AND n.parent_id IS NULL
    JOIN (
        SELECT 
          survey_id, ${selectDate('MAX(date_modified)', 'date_modified')}
        FROM node_def
        GROUP BY survey_id
      ) as nm
      ON s.id = nm.survey_id
    ORDER BY s.id
    `,
    [],
    def => dbTransformCallback(def, true)
  )

const getSurveysByName = async (surveyName, client = db) =>
  await client.map(
      `SELECT * FROM survey WHERE props->>'name' = $1 OR props_draft->>'name' = $1`,
    [surveyName],
    def => dbTransformCallback(def)
  )

const getSurveyById = async (surveyId, draft = false, client = db) =>
  await client.one(
      `SELECT * FROM survey WHERE id = $1`,
    [surveyId],
    def => dbTransformCallback(def, draft)
  )

// ============== UPDATE
const updateSurveyProp = async (surveyId, {key, value}, client = db) => {
  const prop = {[key]: value}

  return await client.one(`
    UPDATE survey 
    SET props_draft = props_draft || $1 
    WHERE id = $2
    RETURNING *
  `, [JSON.stringify(prop), surveyId],
    def => dbTransformCallback(def, true)
  )
}

// ============== DELETE
const deleteSurvey = async (id, client = db) => {
  await client.query(`DROP SCHEMA ${getSurveyDBSchema(id)}`)
  await client.one(`DELETE FROM survey WHERE id = $1 RETURNING id`, [id])
}

module.exports = {
  // CREATE
  insertSurvey,

  // READ
  fetchAllSurveys,
  fetchUserSurveys,
  getSurveysByName,
  getSurveyById,

  //UPDATE
  updateSurveyProp,

  //DELETE
  deleteSurvey,
}
