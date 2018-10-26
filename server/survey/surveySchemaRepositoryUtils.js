const db = require('../db/db')
const {getSurveyDBSchema} = require('../../common/survey/survey')

const publishSurveySchemaTableProps = async (surveyId, tableName, client = db) =>
  await client.query(`
    UPDATE
      ${getSurveyDBSchema(surveyId)}.${tableName}
    SET
      props = props || props_draft,
      props_draft = '{}'::jsonb
  `)

module.exports = {
  publishSurveySchemaTableProps,
}