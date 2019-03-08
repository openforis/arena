const R = require('ramda')

const db = require('../../../db/db')

const {
  getSurveyDBSchema,
  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  deleteSurveySchemaTableProp,
  dbTransformCallback
} = require('../../../survey/surveySchemaRepositoryUtils')

// ============== CREATE

const insertCategory = async (surveyId, category, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category (uuid, props_draft)
        VALUES ($1, $2)
        RETURNING *`,
    [category.uuid, category.props],
    def => dbTransformCallback(def, true, true)
  )

const insertLevel = async (surveyId, categoryUuid, level, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category_level (uuid, category_uuid, index, props_draft)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
    [level.uuid, categoryUuid, level.index, level.props],
    def => dbTransformCallback(def, true, true)
  )

const insertItem = async (surveyId, item, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category_item (uuid, level_uuid, parent_uuid, props_draft)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
    [item.uuid, item.levelUuid, item.parentUuid, item.props],
    def => dbTransformCallback(def, true, true)
  )

// ============== READ

const fetchCategoriesBySurveyId = async (surveyId, draft = false, client = db) =>
  await client.map(`
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.category
    ORDER BY id`,
    [],
    def => dbTransformCallback(def, draft, true)
  )

const fetchLevelsByCategoryUuid = async (surveyId, categoryUuid, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.category_level
     WHERE category_uuid = $1
     ORDER BY index`,
    [categoryUuid],
    def => dbTransformCallback(def, draft, true)
  )

const fetchItemsByCategoryUuid = async (surveyId, categoryUuid, draft = false, client = db) => {
  const items = await client.map(`
      SELECT i.* 
      FROM ${getSurveyDBSchema(surveyId)}.category_item i
      JOIN ${getSurveyDBSchema(surveyId)}.category_level l 
        ON l.uuid = i.level_uuid
        AND l.category_uuid = $1
     ORDER BY i.id
    `,
    [categoryUuid],
    def => dbTransformCallback(def, draft, true)
  )

  return draft
    ? items
    : R.filter(item => item.published)(items)
}

const fetchItemsByParentUuid = async (surveyId, categoryUuid, parentUuid = null, draft = false, client = db) => {
  const items = await client.map(`
    SELECT i.* 
    FROM ${getSurveyDBSchema(surveyId)}.category_item i
    JOIN ${getSurveyDBSchema(surveyId)}.category_level l 
      ON l.uuid = i.level_uuid
    WHERE l.category_uuid = $1 
      AND i.parent_uuid ${
      parentUuid
        ? `= '${parentUuid}'`
        : 'IS NULL'
      }
    ORDER BY i.id
  `,
    [categoryUuid],
    def => dbTransformCallback(def, draft, true)
  )

  return draft
    ? items
    : R.filter(item => item.published)(items)
}

const fetchItemByUuid = async (surveyId, itemUuid, draft = false, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.category_item
     WHERE uuid = $1`,
    [itemUuid],
    item => dbTransformCallback(item, draft, true)
  )

const fetchItemsByLevelIndex = async (surveyId, categoryUuid, levelIndex, draft = false, client = db) =>
  await client.map(
    `SELECT i.* 
     FROM ${getSurveyDBSchema(surveyId)}.category_item i
       JOIN ${getSurveyDBSchema(surveyId)}.category_level l 
         ON l.uuid = i.level_uuid
     WHERE l.category_uuid = $1
       AND l.index = $2`,
    [categoryUuid, levelIndex],
    item => dbTransformCallback(item, draft, true)
  )

// ============== UPDATE

const updateCategoryProp = async (surveyId, categoryUuid, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'category', categoryUuid, key, value, client)

const updateLevelProp = async (surveyId, levelUuid, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'category_level', levelUuid, key, value, client)

const updateItemProp = async (surveyId, itemUuid, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'category_item', itemUuid, key, value, client)

// ============== DELETE

const deleteCategory = async (surveyId, categoryUuid, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'category', categoryUuid, client)

const deleteLevel = async (surveyId, levelUuid, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'category_level', levelUuid, client)

const deleteItem = async (surveyId, itemUuid, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'category_item', itemUuid, client)

const deleteItemLabels = async (surveyId, langCode, client = db) =>
  await deleteSurveySchemaTableProp(surveyId, 'category_item', ['labels', langCode], client)

module.exports = {
  //CREATE
  insertCategory,
  insertLevel,
  insertItem,

  //READ
  fetchCategoriesBySurveyId,
  fetchLevelsByCategoryUuid,
  fetchItemsByCategoryUuid,
  fetchItemsByParentUuid,
  fetchItemByUuid,
  fetchItemsByLevelIndex,

  //UPDATE
  updateCategoryProp,
  updateLevelProp,
  updateItemProp,

  //DELETE
  deleteCategory,
  deleteLevel,
  deleteItem,

  deleteItemLabels,
}