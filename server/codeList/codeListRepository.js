const R = require('ramda')

const db = require('../db/db')

const {
  getSurveyDBSchema,
  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  deleteSurveySchemaTableProp,
  dbTransformCallback
} = require('../survey/surveySchemaRepositoryUtils')

//TODO USE parentUuid
const codeListDbTransformCallback = (record, draft) => R.pipe(
  R.assoc('parentUUID', R.prop('parent_uuid')(record)),
  R.dissoc('parentUuid')
)(dbTransformCallback(record, draft))

// ============== CREATE

const insertCodeList = async (surveyId, codeList, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.code_list (uuid, props_draft)
        VALUES ($1, $2)
        RETURNING *`,
    [codeList.uuid, codeList.props],
    def => codeListDbTransformCallback(def, true)
  )

const insertCodeListLevel = async (surveyId, codeListId, level, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.code_list_level (uuid, code_list_id, index, props_draft)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
    [level.uuid, codeListId, level.index, level.props],
    def => codeListDbTransformCallback(def, true)
  )

const insertCodeListItem = async (surveyId, item, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.code_list_item (uuid, level_id, parent_uuid, props_draft)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
    [item.uuid, item.levelId, item.parentUUID, item.props],
    def => codeListDbTransformCallback(def, true)
  )

// ============== READ

const fetchCodeListsBySurveyId = async (surveyId, draft = false, client = db) =>
  await client.map(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.code_list
    ORDER BY id`,
    [],
    def => codeListDbTransformCallback(def, draft)
  )

const fetchCodeListLevelsByCodeListId = async (surveyId, codeListId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.code_list_level
     WHERE code_list_id = $1
     ORDER BY index`,
    [codeListId],
    def => codeListDbTransformCallback(def, draft)
  )

const fetchCodeListItemsByCodeListId = async (surveyId, codeListId, draft = false, client = db) => {
  const items = await client.map(`
      SELECT i.* 
      FROM ${getSurveyDBSchema(surveyId)}.code_list_item i
      JOIN ${getSurveyDBSchema(surveyId)}.code_list_level l 
        ON l.id = i.level_id
        AND l.code_list_id = $1
     ORDER BY i.id
    `,
    [codeListId],
    def => codeListDbTransformCallback(def, draft)
  )

  return draft
    ? items
    : R.filter(item => item.published)(items)
}

const fetchCodeListItemsByParentUUID = async (surveyId, codeListId, parentUUID = null, draft = false, client = db) => {
  const items = await client.map(`
    SELECT i.* 
    FROM ${getSurveyDBSchema(surveyId)}.code_list_item i
    JOIN ${getSurveyDBSchema(surveyId)}.code_list_level l 
      ON l.id = i.level_id
      AND l.code_list_id = $1
    WHERE i.parent_uuid ${
      parentUUID
        ? `= '${parentUUID}'`
        : 'IS NULL'
      }
    ORDER BY i.id
  `,
    [codeListId],
    def => codeListDbTransformCallback(def, draft)
  )

  return draft
    ? items
    : R.filter(item => item.published)(items)
}

const fetchCodeListItemByUUID = async (surveyId, itemUUID, draft = false, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.code_list_item
     WHERE uuid = $1
    `,
    [itemUUID],
    def => codeListDbTransformCallback(def, draft)
  )

// ============== UPDATE

const updateCodeListProp = async (surveyId, codeListId, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'code_list', codeListId, key, value, client)

const updateCodeListLevelProp = async (surveyId, codeListLevelId, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'code_list_level', codeListLevelId, key, value, client)

const updateCodeListItemProp = async (surveyId, codeListItemId, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'code_list_item', codeListItemId, key, value, client)

// ============== DELETE

const deleteCodeList = async (surveyId, codeListId, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'code_list', codeListId, client)

const deleteCodeListLevel = async (surveyId, codeListLevelId, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'code_list_level', codeListLevelId, client)

const deleteCodeListItem = async (surveyId, codeListItemId, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'code_list_item', codeListItemId, client)

const deleteCodeListsItemsLabels = async (surveyId, langCode, client = db) =>
  await deleteSurveySchemaTableProp(surveyId, 'code_list_item', ['labels', langCode], client)

module.exports = {
  //CREATE
  insertCodeList,
  insertCodeListLevel,
  insertCodeListItem,

  //READ
  fetchCodeListsBySurveyId,
  fetchCodeListLevelsByCodeListId,
  fetchCodeListItemsByCodeListId,
  fetchCodeListItemsByParentUUID,
  fetchCodeListItemByUUID,

  //UPDATE
  updateCodeListProp,
  updateCodeListLevelProp,
  updateCodeListItemProp,

  //DELETE
  deleteCodeList,
  deleteCodeListLevel,
  deleteCodeListItem,

  deleteCodeListsItemsLabels,
}