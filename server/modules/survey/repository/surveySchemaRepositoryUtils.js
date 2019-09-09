const R = require('ramda')
const camelize = require('camelize')
const db = require('../../../db/db')
const { now } = require('../../../db/dbUtils')

const mergeProps = (def, draft) => {
  const { props, propsDraft } = def

  return R.pipe(
    R.when(
      R.always(draft),
      () => R.mergeRight(props, propsDraft)
    ),
    propsMerged => R.assoc('props', propsMerged)(def),
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
        date_modified = ${now}
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

const updateSurveySchemaTableProp = async (surveyId, tableName, recordUuid, key, value, client = db) =>
  await client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.${tableName}
     SET props_draft = props_draft || $1
     WHERE uuid = $2
     RETURNING *`
    , [JSON.stringify({ [key]: value }), recordUuid]
    , def => dbTransformCallback(def, true)
  )

const deleteSurveySchemaTableRecord = async (surveyId, tableName, recordUuid, client = db) =>
  await client.one(`
    DELETE 
    FROM ${getSurveyDBSchema(surveyId)}.${tableName} 
    WHERE uuid = $1 RETURNING *`
    , [recordUuid]
    , def => dbTransformCallback(def, true)
  )

const deleteSurveySchemaTableProp = async (surveyId, tableName, deletePath, client = db) =>
  await client.none(`
    UPDATE ${getSurveyDBSchema(surveyId)}.${tableName} SET props = props #- '{${deletePath.join(',')}}'`)

const disableSurveySchemaTableTriggers = async (surveyId, tableName, client = db) =>
  await client.none(`ALTER TABLE ${getSurveyDBSchema(surveyId)}.${tableName} DISABLE TRIGGER ALL`)

const enableSurveySchemaTableTriggers = async (surveyId, tableName, client = db) =>
  await client.none(`ALTER TABLE ${getSurveyDBSchema(surveyId)}.${tableName} ENABLE TRIGGER ALL`)

module.exports = {
  dbTransformCallback,

  getSurveyDBSchema,

  markSurveyDraft,
  publishSurveySchemaTableProps,

  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  deleteSurveySchemaTableProp,

  disableSurveySchemaTableTriggers,
  enableSurveySchemaTableTriggers
}
