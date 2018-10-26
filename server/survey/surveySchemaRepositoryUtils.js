const db = require('../db/db')

const {dbTransformCallback} = require('../nodeDef/nodeDefRepository')

const getSurveyDBSchema = surveyId => `survey_${surveyId}`

// ====== UPDATE

const markSurveyDraft = async (surveyId, client = db) =>
  await client.query(`
    UPDATE survey 
    SET draft = true
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

const updateSurveySchemaTableProp = async (tableName, surveyId, id, {key, value}, draft = true, client = db) =>
  updateSurveySchemaTableProps(tableName, surveyId, id, {[key]: value}, draft, client)


const updateSurveySchemaTableProps = async (tableName, surveyId, id, props, draft = true, client = db) => {
  const propsCol = draft ? 'props_draft' : 'props'

  return await client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.${tableName}
     SET ${propsCol} = ${propsCol} || $1
     WHERE id = $2
     RETURNING *`
    , [JSON.stringify(props), id]
    , def => dbTransformCallback(def, draft)
  )
}

const deleteSurveySchemaTableRecord = async (tableName, surveyId, id, client = db) =>
  await client.one(`
    DELETE 
    FROM ${getSurveyDBSchema(surveyId)}.${tableName} 
    WHERE id = $1 RETURNING *`
    , [id]
    , def => dbTransformCallback(def, true)
  )

module.exports = {
  getSurveyDBSchema,

  markSurveyDraft,
  publishSurveySchemaTableProps,

  updateSurveySchemaTableProp,
  updateSurveySchemaTableProps,
  deleteSurveySchemaTableRecord,
}
