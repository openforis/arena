const db = require('../db/db')

const {getSurveyDBSchema} = require('../../common/survey/survey')
const {dbTransformCallback} = require('../nodeDef/nodeDefRepository')

const updateSurveyTableProp = async (tableName, surveyId, id, {key, value}, client = db) => {
  const prop = {[key]: value}

  return await client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.${tableName}
     SET props_draft = props_draft || $1
     WHERE id = $2
     RETURNING *`
    , [JSON.stringify(prop), id]
    , def => dbTransformCallback(def, true)
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
  deleteSurveyTableRecord,
}