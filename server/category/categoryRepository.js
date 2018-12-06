const R = require('ramda')

const db = require('../db/db')

const {
  getSurveyDBSchema,
  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  deleteSurveySchemaTableProp,
  dbTransformCallback
} = require('../survey/surveySchemaRepositoryUtils')

// ============== CREATE

const insertCategory = async (surveyId, category, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category (uuid, props_draft)
        VALUES ($1, $2)
        RETURNING *`,
    [category.uuid, category.props],
    def => dbTransformCallback(def, true, true)
  )

const insertLevel = async (surveyId, categoryId, level, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category_level (uuid, category_id, index, props_draft)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
    [level.uuid, categoryId, level.index, level.props],
    def => dbTransformCallback(def, true, true)
  )

const insertItem = async (surveyId, item, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category_item (uuid, level_id, parent_uuid, props_draft)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
    [item.uuid, item.levelId, item.parentUuid, item.props],
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

const fetchLevelsByCategoryId = async (surveyId, categoryId, draft = false, client = db) =>
  await client.map(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.category_level
     WHERE category_id = $1
     ORDER BY index`,
    [categoryId],
    def => dbTransformCallback(def, draft, true)
  )

const fetchItemsByCategoryId = async (surveyId, categoryId, draft = false, client = db) => {
  const items = await client.map(`
      SELECT i.* 
      FROM ${getSurveyDBSchema(surveyId)}.category_item i
      JOIN ${getSurveyDBSchema(surveyId)}.category_level l 
        ON l.id = i.level_id
        AND l.category_id = $1
     ORDER BY i.id
    `,
    [categoryId],
    def => dbTransformCallback(def, draft, true)
  )

  return draft
    ? items
    : R.filter(item => item.published)(items)
}

const fetchItemsByParentUuid = async (surveyId, categoryId, parentUuid = null, draft = false, client = db) => {
  const items = await client.map(`
    SELECT i.* 
    FROM ${getSurveyDBSchema(surveyId)}.category_item i
    JOIN ${getSurveyDBSchema(surveyId)}.category_level l 
      ON l.id = i.level_id
      AND l.category_id = $1
    WHERE i.parent_uuid ${
      parentUuid
        ? `= '${parentUuid}'`
        : 'IS NULL'
      }
    ORDER BY i.id
  `,
    [categoryId],
    def => dbTransformCallback(def, draft, true)
  )

  return draft
    ? items
    : R.filter(item => item.published)(items)
}

const fetchItemByUuid = async (surveyId, itemUuid, draft = false, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.category_item
     WHERE uuid = $1
    `,
    [itemUuid],
    def => dbTransformCallback(def, draft, true)
  )

// ============== UPDATE

const updateCategoryProp = async (surveyId, categoryId, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'category', categoryId, key, value, client)

const updateLevelProp = async (surveyId, levelId, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'category_level', levelId, key, value, client)

const updateItemProp = async (surveyId, itemId, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'category_item', itemId, key, value, client)

// ============== DELETE

const deleteCategory = async (surveyId, categoryId, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'category', categoryId, client)

const deleteLevel = async (surveyId, levelId, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'category_level', levelId, client)

const deleteItem = async (surveyId, itemId, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'category_item', itemId, client)

const deleteItemLabels = async (surveyId, langCode, client = db) =>
  await deleteSurveySchemaTableProp(surveyId, 'category_item', ['labels', langCode], client)

module.exports = {
  //CREATE
  insertCategory,
  insertLevel,
  insertItem,

  //READ
  fetchCategoriesBySurveyId,
  fetchLevelsByCategoryId,
  fetchItemsByCategoryId,
  fetchItemsByParentUuid,
  fetchItemByUuid,

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