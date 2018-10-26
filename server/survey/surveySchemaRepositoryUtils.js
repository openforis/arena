const db = require('../db/db')
const {getSurveyDBSchema} = require('../../common/survey/survey')

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

module.exports = {
  markSurveyDraft,
  publishSurveySchemaTableProps,
}