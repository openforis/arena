const db = require('../db/db')
const Promise = require('bluebird')

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
    insertedCodeList.levels = await Promise.all(
      codeList.levels.map(async level =>
        await insertCodeListLevel(surveyId, insertedCodeList.id, level, t)
      )
    )
    return insertedCodeList
  }
)

const insertCodeListLevel = async (surveyId, codeListId, level, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.code_list_level (uuid, code_list_id, index, props_draft)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
    [level.uuid, codeListId, level.index, level.props],
    def => dbTransformCallback(def, true)
  )

const insertCodeListItem = async (surveyId, item, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.code_list_item (uuid, level_id, parent_id, props_draft)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
    [item.uuid, item.levelId, item.parentId, item.props],
    def => dbTransformCallback(def, true)
  )


// ============== READ
const fetchCodeListsBySurveyId = async (surveyId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.code_list`,
    [],
    def => dbTransformCallback(def, draft)
  )

const fetchCodeListById = async (surveyId, id, draft = false, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.code_list
     WHERE id = $1`,
    [id],
    def => dbTransformCallback(def, draft)
  )

const fetchCodeListLevelsByCodeListId = async (surveyId, codeListId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.code_list_level
     WHERE code_list_id = $1
     ORDER BY index`,
    [codeListId],
    def => dbTransformCallback(def, draft)
  )

const fetchCodeListItemsByCodeListId = async (surveyId, levelId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.code_list_item
     WHERE level_id = $1
     ORDER BY parent_id, id`,
    [levelId],
    def => dbTransformCallback(def, draft)
  )

// ============== UPDATE
const updateProps = async (surveyId, tableName, id, props, client = db) =>
  await client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.${tableName}
     SET props_draft = $1
     WHERE id = $2
     RETURNING *`,
    [props, id],
    def => dbTransformCallback(def, true)
  )

const updateCodeListLevel = async (surveyId, level, client = db) =>
  await updateProps(surveyId, 'code_list_level', level.id, level.props, client)

const updateCodeList = async (surveyId, codeList, client = db) =>
  await updateProps(surveyId, 'code_list', codeList.id, codeList.props, client)

const updateCodeListItem = async (surveyId, item, client = db) =>
  await updateProps(surveyId, 'code_list_item', item.id, item.props, client)

module.exports = {
  //CREATE
  insertCodeList,
  insertCodeListLevel,
  insertCodeListItem,
  //READ
  fetchCodeListById,
  fetchCodeListsBySurveyId,
  fetchCodeListLevelsByCodeListId,
  fetchCodeListItemsByCodeListId,
  //UPDATE
  updateCodeList,
  updateCodeListLevel,
  updateCodeListItem,
}