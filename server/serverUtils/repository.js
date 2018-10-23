const db = require('../db/db')

const {getSurveyDBSchema} = require('../../common/survey/survey')
const {dbTransformCallback} = require('../nodeDef/nodeDefRepository')

const updateSurveyTableProp = async (tableName, surveyId, id, {key, value}, draft = true, client = db) => {
  return updateSurveyTableProps(tableName, surveyId, id, {[key]: value}, draft, client)
}

const updateSurveyTableProps = async (tableName, surveyId, id, props, draft = true, client = db) => {
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

// ============== DELETE

const deleteSurveyTableRecord = async (tableName, surveyId, id, client = db) =>
  await client.one(`
    DELETE 
    FROM ${getSurveyDBSchema(surveyId)}.${tableName} 
    WHERE id = $1 RETURNING *`
    , [id]
    , def => dbTransformCallback(def, true)
  )

module.exports = {
  updateSurveyTableProp,
  updateSurveyTableProps,
  deleteSurveyTableRecord,
}