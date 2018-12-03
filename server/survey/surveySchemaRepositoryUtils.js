const R = require('ramda')
const camelize = require('camelize')
const db = require('../db/db')

const mergeProps = (def, draft) => {
  const {props, propsDraft} = def
  const propsMerged = draft ? R.mergeDeepRight(props, propsDraft, def) : props

  return R.pipe(
    R.assoc('props', propsMerged),
    R.dissoc('propsDraft'),
  )(def)
}

const dbTransformCallback = (def, draft = false, assocPublishedDraft = false) => R.pipe(
  // assoc published and draft properties based on props
  def => assocPublishedDraft ? R.pipe(
    R.assoc('published', !R.isEmpty(def.props)),
    R.assoc('draft', !R.isEmpty(def.props_draft)),
    )(def)
    : def,
  camelize,
  // apply db conversion
  def => mergeProps(def, draft)
)(def)

const getSurveyDBSchema = surveyId => `survey_${surveyId}`

// ====== UPDATE

const markSurveyDraft = async (surveyId, client = db) =>
  await client.query(`
    UPDATE survey
    SET draft         = true,
        date_modified = now()
    WHERE id = $1
  `, [surveyId])

const publishSurveySchemaTableProps = async (surveyId, tableName, client = db) =>
  await client.query(`
    UPDATE
      ${getSurveyDBSchema(surveyId)}.${tableName}
    SET
      props = props || props_draft,
      props_draft = '{}'::jsonb
  `)

const updateSurveySchemaTableProp = async (surveyId, tableName, recordId, key, value, client = db) =>
  await client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.${tableName}
     SET props_draft = props_draft || $1
     WHERE id = $2
     RETURNING *`
    , [JSON.stringify({[key]: value}), recordId]
    , def => dbTransformCallback(def, true)
  )

const deleteSurveySchemaTableRecord = async (surveyId, tableName, recordId, client = db) =>
  await client.one(`
    DELETE 
    FROM ${getSurveyDBSchema(surveyId)}.${tableName} 
    WHERE id = $1 RETURNING *`
    , [recordId]
    , def => dbTransformCallback(def, true)
  )

const deleteSurveySchemaTableProp = async (surveyId, tableName, deletePath, client = db) =>
  await client.none(`
    UPDATE ${getSurveyDBSchema(surveyId)}.${tableName} SET props = props #- '{${deletePath.join(',')}}'`)

module.exports = {
  dbTransformCallback,

  getSurveyDBSchema,

  markSurveyDraft,
  publishSurveySchemaTableProps,

  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  deleteSurveySchemaTableProp,
}
