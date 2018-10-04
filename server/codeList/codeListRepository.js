const db = require('../db/db')
const Promise = require('bluebird')
const R = require('ramda')

const {updateProp, deleteRecord} = require('../serverUtils/repository')
const {dbTransformCallback} = require('../nodeDef/nodeDefRepository')
const {getSurveyDBSchema} = require('../../common/survey/survey')
const {getCodeListLevelsArray, assocCodeListLevelsArray} = require('../../common/survey/codeList')

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
    const levels = getCodeListLevelsArray(codeList)

    //insert levels
    const insertedLevels = await Promise.all(
      levels.map(async level =>
        await insertCodeListLevel(surveyId, insertedCodeList.id, level, t)
      )
    )

    return assocCodeListLevelsArray(insertedLevels)(insertedCodeList)
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

const fetchCodeListLevelsByCodeListId = async (surveyId, codeListId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.code_list_level
     WHERE code_list_id = $1
     ORDER BY index`,
    [codeListId],
    def => dbTransformCallback(def, draft)
  )

const fetchCodeListItemsByCodeListId = async (surveyId, codeListId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.code_list_item
     WHERE 
      level_id IN (
        SELECT l.id from ${getSurveyDBSchema(surveyId)}.code_list_level l WHERE l.code_list_id = $1
      ) 
     ORDER BY id`,
    [codeListId],
    def => dbTransformCallback(def, draft)
  )

// ============== UPDATE

const updateCodeListProp = R.partial(updateProp, ['code_list'])

const updateCodeListLevelProp = R.partial(updateProp, ['code_list_level'])

const updateCodeListItemProp = R.partial(updateProp, ['code_list_item'])

// ============== DELETE

const deleteCodeList = R.partial(deleteRecord, ['code_list'])

const deleteCodeListLevel = R.partial(deleteRecord, ['code_list_level'])

const deleteCodeListItem = R.partial(deleteRecord, ['code_list_item'])

module.exports = {
  //CREATE
  insertCodeList,
  insertCodeListLevel,
  insertCodeListItem,

  //READ
  fetchCodeListsBySurveyId,
  fetchCodeListLevelsByCodeListId,
  fetchCodeListItemsByCodeListId,

  //UPDATE
  updateCodeListProp,
  updateCodeListLevelProp,
  updateCodeListItemProp,

  //DELETE
  deleteCodeList,
  deleteCodeListLevel,
  deleteCodeListItem,
}