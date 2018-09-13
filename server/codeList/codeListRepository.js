const db = require('../db/db')

const {dbTransformCallback} = require('../nodeDef/nodeDefRepository')
const {getSurveyDBSchema} = require('../../common/survey/survey')

// ============== CREATE
const insertCodeList = async (surveyId, codeList, client = db) =>
  await client.one(`
      INSERT INTO ${getSurveyDBSchema(surveyId)}.code_list (uuid, props_draft)
      VALUES ($1, $2)
      RETURNING *`,
      [codeList.uuid, codeList.props],
      def => dbTransformCallback(def, true)
  )


// ============== READ
const fetchCodeListsBySurveyId = async (surveyId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.code_list`,
    [],
    def => dbTransformCallback(def, draft)
  )

module.exports = {
  //CREATE
  insertCodeList,
  //READ
  fetchCodeListsBySurveyId,
}