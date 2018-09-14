const db = require('../db/db')

const {dbTransformCallback} = require('../nodeDef/nodeDefRepository')
const {getSurveyDBSchema} = require('../../common/survey/survey')

// ============== CREATE
const insertCodeList = async (surveyId, codeList, client = db) => client.tx(
  async t => {
    const insertedCodeList = await t.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.code_list (uuid, props_draft)
        VALUES ($1, $2)
        RETURNING *`,
      [codeList.uuid, codeList.props],
      def => dbTransformCallback(def, true)
    )

    //insert levels
    insertedCodeList.levels = codeList.map(level =>
      insertCodeListLevel(surveyId, codeList.id, level, tx)
    )
    return codeList
  }
)

const insertCodeListLevel = async (surveyId, codeListId, level, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.code_list_level (uuid, index, props_draft)
        VALUES ($1, $2, $3)
        RETURNING *`,
    [level.uuid, level.index, level.props],
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