const db = require('../../../db/db')
const R = require('ramda')

const { dbTransformCallback } = require('./surveySchemaRepositoryUtils')
const { selectDate } = require('../../../db/dbUtils')

const surveySelectFields = (alias = '') => {
  const prefix = alias ? alias + '.' : ''
  return `${prefix}id, ${prefix}uuid, ${prefix}published, ${prefix}draft, ${prefix}props, ${prefix}props_draft, ${prefix}owner_id,
  ${selectDate(`${prefix}date_created`, 'date_created')}, 
  ${selectDate(`${prefix}date_modified`, 'date_modified')}`
}

// ============== CREATE

const insertSurvey = async (props, userId, client = db) =>
  await client.one(`
      INSERT INTO survey (owner_id, props_draft)
      VALUES ($1, $2)
      RETURNING ${surveySelectFields()}
    `,
  [userId, props],
  def => dbTransformCallback(def, true))

// ============== READ

const fetchAllSurveyIds = async (client = db) =>
  await client.map(`SELECT id FROM survey`, [], R.prop('id'))

const fetchSurveys = async (user, checkAccess = true, client = db) =>
  await client.map(`
    SELECT ${surveySelectFields('s')}
    FROM survey s
    ${checkAccess ? `
    JOIN auth_group g
      ON s.id = g.survey_id
    JOIN auth_group_user gu
      ON gu.group_id = g.id AND gu.user_id = $1`
    : ''}
    ORDER BY s.id
    `,
  [user.id],
  def => dbTransformCallback(def, true))

const getSurveysByName = async (surveyName, client = db) =>
  await client.map(
    `SELECT ${surveySelectFields()} FROM survey WHERE props->>'name' = $1 OR props_draft->>'name' = $1`,
    [surveyName],
    def => dbTransformCallback(def)
  )

const getSurveyById = async (surveyId, draft = false, client = db) =>
  await client.one(
    `SELECT ${surveySelectFields()} FROM survey WHERE id = $1`,
    [surveyId],
    def => dbTransformCallback(def, draft)
  )

const fetchDependencies = async (surveyId, client = db) =>
  await client.oneOrNone(
    `SELECT meta#>'{dependencyGraphs}' as dependencies FROM survey WHERE id = $1`,
    [surveyId],
    R.prop('dependencies')
  )

// ============== UPDATE

const updateSurveyProp = async (surveyId, key, value, client = db) => {
  const prop = { [key]: value }

  return await client.one(`
    UPDATE survey
    SET props_draft = props_draft || $1,
    draft = true
    WHERE id = $2
    RETURNING ${surveySelectFields()}
  `, [JSON.stringify(prop), surveyId],
  def => dbTransformCallback(def, true))
}

const publishSurveyProps = async (surveyId, client = db) =>
  await client.one(`
    UPDATE
        survey
    SET
        props = props || props_draft,
        props_draft = '{}'::jsonb,
        draft = false,
        published = true
    WHERE
        id = $1
    RETURNING ${surveySelectFields()}
    `, [surveyId]
  )

const updateSurveyDependencyGraphs = async (surveyId, dependencyGraphs, client = db) => {
  const meta = {
    dependencyGraphs
  }
  return await client.one(`
    UPDATE survey
    SET meta = meta || $1::jsonb
    WHERE id = $2
    RETURNING ${surveySelectFields()}
    `, [meta, surveyId]
  )
}

// ============== DELETE
const deleteSurvey = async (id, client = db) =>
  await client.one(`DELETE FROM survey WHERE id = $1 RETURNING id`, [id])

const deleteSurveyLabel = async (id, langCode, client = db) =>
  await deleteSurveyProp(id, ['labels', langCode], client)

const deleteSurveyDescription = async (id, langCode, client = db) =>
  await deleteSurveyProp(id, ['descriptions', langCode], client)

const deleteSurveyProp = async (id, deletePath, client = db) =>
  await client.none(`
    UPDATE survey 
    SET props = props #- '{${deletePath.join(',')}}'
    WHERE id = $1`,
    [id])

module.exports = {
  // CREATE
  insertSurvey,

  // READ
  fetchAllSurveyIds,
  fetchSurveys,
  getSurveysByName,
  getSurveyById,
  fetchDependencies,

  //UPDATE
  updateSurveyProp,
  publishSurveyProps,
  updateSurveyDependencyGraphs,

  //DELETE
  deleteSurvey,
  deleteSurveyLabel,
  deleteSurveyDescription,
}