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

    const surveyId = await t.one(`
      INSERT INTO survey (owner_id, props)
      VALUES ($1, $2)
      RETURNING id
    `, [ownerId, props])

    const rootNodeDef = createEntityDef({name: 'root_entity', label: 'Root entity'})

    const {id: surveyVersionId} = await createSurveyVersion(surveyVersionId, [rootNodeDef], t)

    await t.any(`UPDATE survey SET draft_version_id = $1`, [surveyVersionId])

    return await getSurvey(surveyId, t)
  }
)

// ============== READ
const getSurvey = async (surveyId, client = db) => await client.one(
  `SELECT * FROM survey WHERE id = $1`,
  [surveyId],
  camelize
)

// ============== UPDATE

// ============== DELETE

module.exports = {
  createSurvey,
  getSurvey,
}
