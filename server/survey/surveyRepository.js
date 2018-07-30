const db = require('../db/db')
const camelize = require('camelize')

const {uuidv4} = require('../../common/uuid')

const {setUserPref} = require('../user/userRepository')
const userPref = require('../user/userPrefs')

const {createEntityDef} = require('./nodeDefRepository')
// const {createEntityDef} = require('../../common/survey/nodeDef')

// ============== CREATE

const createSurvey = async (user, props) => db.tx(
  async t => {

    const {id: surveyId} = await t.one(`
      INSERT INTO survey (owner_id, props)
      VALUES ($1, $2)
      RETURNING id
    `, [user.id, props])

    const {id: rootNodeDefId} = createEntityDef(surveyId, null, {name: 'root_entity', label: 'Root entity'})

    await t.any(`UPDATE survey SET root_node_def_id = $1 WHERE id = $2`, [rootNodeDefId, surveyId])

    // update user prefs
    await setUserPref(user, userPref.survey, surveyId, t)

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
