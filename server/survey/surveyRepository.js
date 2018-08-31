const db = require('../db/db')

const {uuidv4} = require('../../common/uuid')

const {setUserPref} = require('../user/userRepository')
const {userPrefNames} = require('../user/userPrefs')

const {
  createEntityDef,
  dbTransformCallback,
  nodeDefSelectFields,
} = require('../nodeDef/nodeDefRepository')

const {
  nodeDefLayoutProps,
  nodeDefRenderType,
} = require('../../common/survey/nodeDefLayout')

const {
  defaultSteps,
} = require('../../common/survey/survey')

const { migrateSurveySchema } = require('../db/migration/survey/execMigrations')

// ============== CREATE

const createSurvey = async (user, {name, label, lang}) => db.tx(
  async t => {
    const props = {
      name,
      labels: {[lang]: label},
      languages: [lang],
      srs: ['4326'], //EPSG:4326 WGS84 Lat Lon Spatial Reference System,
      steps: {...defaultSteps},
    }

    const {id: surveyId} = await t.one(`
      INSERT INTO survey (owner_id, props_draft)
      VALUES ($1, $2)
      RETURNING id
    `, [user.id, props])

    const rootEntityDefProps = {
      name: 'root_entity',
      labels: {[lang]: 'Root entity'},
      multiple: false,
      [nodeDefLayoutProps.pageUUID]: uuidv4(),
      [nodeDefLayoutProps.render]: nodeDefRenderType.form,
    }
    await createEntityDef(surveyId, null, uuidv4(), rootEntityDefProps, t)

    //create survey data schema
    migrateSurveySchema(surveyId)

    // update user prefs
    await setUserPref(user, userPrefNames.survey, surveyId, t)

    return await getSurveyById(surveyId, true, t)
  }
)

// ============== READ
const getSurveyById = async (surveyId, draft = false, client = db) =>
  await client.one(
    `SELECT * FROM survey WHERE id = $1`,
    [surveyId],
    def => dbTransformCallback(def, draft)
  )

const getSurveysByName = async (surveyName, client = db) =>
  await client.map(
    `SELECT * FROM survey WHERE props->>'name' = $1 OR props_draft->>'name' = $1`,
    [surveyName],
    def => dbTransformCallback(def)
  )

const fetchSurveys = async (client = db) =>
  await client.map(
    `SELECT * FROM survey`,
    [],
    def => dbTransformCallback(def)
  )

const fetchRootNodeDef = async (surveyId, draft, client = db) =>
  await client.one(
    `SELECT ${nodeDefSelectFields}
     FROM node_def 
     WHERE parent_id IS NULL
     AND survey_id =$1`,
    [surveyId],
    res => dbTransformCallback(res, draft)
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

module.exports = {
  // CREATE
  createSurvey,

  // READ
  getSurveyById,
  getSurveysByName,
  fetchSurveys,
  fetchRootNodeDef,

  //UPDATE
  updateSurveyProp,

}
