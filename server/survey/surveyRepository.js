const db = require('../db/db')
const camelize = require('camelize')

const {uuidv4} = require('../../common/uuid')

// const {createEntityDef} = require('./nodeDefRepository')
const {createEntityDef} = require('../../common/survey/nodeDef')

// ============== CREATE

const createSurveyVersion = async (surveyId, nodeDefs, client = db) => await client.one(
  `
  INSERT INTO survey_version (survey_id, node_defs)
  VALUES ($1, $2)
  RETURNING *
  `,
  [surveyId, nodeDefs],
  camelize
)

const createSurvey = async (ownerId, props) => db.tx(
  async t => {

    const {id: surveyId} = await t.one(`
      INSERT INTO survey (owner_id, props)
      VALUES ($1, $2)
      RETURNING id
    `, [ownerId, props])

    const rootNodeDef = createEntityDef({id: 1, name: 'root_entity', label: 'Root entity'})

    const {id: surveyVersionId} = await createSurveyVersion(surveyId, {nodeDefs: [rootNodeDef]}, t)

    await t.any(`UPDATE survey SET draft_version_id = $1 WHERE id = $2`, [surveyVersionId, surveyId])

    return await getSurveyById(surveyId, t)
  }
)

// ============== READ
const getSurveyById = async (surveyId, client = db) => await client.one(
  `SELECT * FROM survey WHERE id = $1`,
  [surveyId],
  camelize
)

const getSurveyByName = async (surveyName, client = db) => await client.oneOrNone(
  `SELECT * FROM survey WHERE props->>'name' = $1`,
  [surveyName],
  camelize
)

// ============== UPDATE

// ============== DELETE

module.exports = {
  // CREATE
  createSurvey,

  // READ
  getSurveyById,
  getSurveyByName,
}
