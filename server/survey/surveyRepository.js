const db = require('../db/db')
const {getSurveyDBSchema} = require('../../common/survey/survey')

const {uuidv4} = require('../../common/uuid')
const {selectDate} = require('../db/dbUtils')

const {updateUserPref} = require('../user/userRepository')
const {userPrefNames} = require('../../common/user/userPrefs')

const {
  defDbTransformCallback: dbTransformCallback
} = require('../../common/survey/surveyUtils')

const {defaultSteps} = require('../../common/survey/survey')

const {
  createEntityDef,
  nodeDefSelectFields,
} = require('../nodeDef/nodeDefRepository')

const {
  nodeDefLayoutProps,
  nodeDefRenderType,
} = require('../../common/survey/nodeDefLayout')

const {migrateSurveySchema} = require('../db/migration/survey/execMigrations')

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
    await updateUserPref(user, userPrefNames.survey, surveyId, t)

    return await getSurveyById(surveyId, true, t)
  }
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
const deleteSurvey = async (id, client = db) => {
  await client.query(`DROP SCHEMA ${getSurveyDBSchema(id)}`)
  await client.one(`DELETE FROM survey WHERE id = $1 RETURNING id`, [id])
}

module.exports = {
  // CREATE
  createSurvey,

  // READ
  fetchAllSurveys,
  fetchUserSurveys,
  getSurveysByName,
  getSurveyById,
  fetchRootNodeDef,

  //UPDATE
  updateSurveyProp,

  //DELETE
  deleteSurvey,
}
