const R = require('ramda')

const db = require('../../../db/db')
const DbUtils = require('../../../db/dbUtils')

const Category = require('../../../../common/survey/category')
const CategoryLevel = require('../../../../common/survey/categoryLevel')
const CategoryItem = require('../../../../common/survey/categoryItem')

const {
  getSurveyDBSchema,
  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  deleteSurveySchemaTableProp,
  dbTransformCallback
} = require('../../survey/repository/surveySchemaRepositoryUtils')

// ============== CREATE

const insertCategory = async (surveyId, category, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category (uuid, props_draft)
        VALUES ($1, $2)
        RETURNING *`,
    [Category.getUuid(category), category.props],
    def => dbTransformCallback(def, true, true)
  )

const insertLevel = async (surveyId, level, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category_level (uuid, category_uuid, index, props_draft)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
    [Category.getUuid(level), CategoryLevel.getCategoryUuid(level), CategoryLevel.getIndex(level), level.props],
    def => dbTransformCallback(def, true, true)
  )

const insertItem = async (surveyId, item, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category_item (uuid, level_uuid, parent_uuid, props_draft)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
    [Category.getUuid(item), CategoryItem.getLevelUuid(item), CategoryItem.getParentUuid(item), item.props],
    def => dbTransformCallback(def, true, true)
  )

const insertItems = async (surveyId, items, client = db) => {
  const values = items.map(item => [
    CategoryItem.getUuid(item),
    CategoryItem.getLevelUuid(item),
    CategoryItem.getParentUuid(item),
    item.props
  ])

  await client.none(DbUtils.insertAllQuery(
    getSurveyDBSchema(surveyId),
    'category_item',
    ['uuid', 'level_uuid', 'parent_uuid', 'props_draft'],
    values
  ))
}

// ============== READ

const _getFetchCategoriesAndLevelsQuery = (surveyId, draft, includeValidation) => `
    WITH
      levels AS
      (
        SELECT
          l.category_uuid,
          json_object_agg(l.index::text, json_build_object(
            'id', l.id, 
            'uuid', l.uuid, 
            'index', l.index, 
            'props', l.props${draft ? ` || l.props_draft` : ''}
          )) AS levels
        FROM
          ${getSurveyDBSchema(surveyId)}.category_level l
        GROUP BY
          l.category_uuid
      )
    SELECT
      json_object_agg(c.uuid, json_build_object( 
      'id', c.id,
      'uuid', c.uuid,
      'props', c.props${draft ? ` || c.props_draft` : ''},
      'published', c.published, 
      'levels', l.levels
      ${includeValidation ? `, 'validation', c.validation` : ''}
      )) AS categories
    FROM
      ${getSurveyDBSchema(surveyId)}.category c
    JOIN
      levels l
    ON
      c.uuid = l.category_uuid`

const fetchCategoriesAndLevelsBySurveyId = async (surveyId, draft = false, includeValidation = false, client = db) => {
  const { categories } = await client.one(_getFetchCategoriesAndLevelsQuery(surveyId, draft, includeValidation))
  return categories || {}
}

const fetchCategoryAndLevelsByUuid = async (surveyId, categoryUuid, draft = false, includeValidation = false, client = db) => {
  const { categories } = await client.one(
    `${_getFetchCategoriesAndLevelsQuery(surveyId, draft, includeValidation)} WHERE c.uuid = $1`,
    [categoryUuid]
  )
  return R.pipe(R.values, R.head)(categories)
}

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

const fetchIndex = async (surveyId, draft = false, client = db) =>
  await client.map(`
    SELECT 
      l.category_uuid,
      i.parent_uuid,
      i.props,
      i.props_draft,
      i.uuid,
      i.level_uuid
    FROM
       ${getSurveyDBSchema(surveyId)}.category_item i
    JOIN
       ${getSurveyDBSchema(surveyId)}.category_level l
    ON
      i.level_uuid = l.uuid
    `,
    [],
    indexItem => dbTransformCallback(indexItem, draft, true)
  )

// ============== UPDATE

const updateCategoryProp = async (surveyId, categoryUuid, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'category', categoryUuid, key, value, client)

const updateCategoryValidation = async (surveyId, categoryUuid, validation, client = db) =>
  await client.none(`
      UPDATE ${getSurveyDBSchema(surveyId)}.category 
      SET validation = $1::jsonb 
      WHERE uuid = $2
    `,
    [validation, categoryUuid]
  )

const markCategoriesPublishedBySurveyId = async (surveyId, client = db) =>
  await client.any(`
      UPDATE ${getSurveyDBSchema(surveyId)}.category
      SET published = true
  `)

const updateLevelProp = async (surveyId, levelUuid, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'category_level', levelUuid, key, value, client)

const updateItemProp = async (surveyId, itemUuid, key, value, client = db) =>
  await updateSurveySchemaTableProp(surveyId, 'category_item', itemUuid, key, value, client)

// ============== DELETE

const deleteCategory = async (surveyId, categoryUuid, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'category', categoryUuid, client)

const deleteLevel = async (surveyId, levelUuid, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'category_level', levelUuid, client)

const deleteLevelsByCategory = async (surveyId, categoryUuid, client = db) =>
  await client.none(`
      DELETE FROM ${getSurveyDBSchema(surveyId)}.category_level 
      WHERE category_uuid = $1
    `,
    [categoryUuid]
  )

const deleteItem = async (surveyId, itemUuid, client = db) =>
  await deleteSurveySchemaTableRecord(surveyId, 'category_item', itemUuid, client)

const deleteItemLabels = async (surveyId, langCode, client = db) =>
  await deleteSurveySchemaTableProp(surveyId, 'category_item', ['labels', langCode], client)

module.exports = {
  //CREATE
  insertCategory,
  insertLevel,
  insertItem,
  insertItems,

  //READ
  fetchCategoriesAndLevelsBySurveyId,
  fetchCategoryAndLevelsByUuid,
  fetchItemsByCategoryUuid,
  fetchItemsByParentUuid,
  fetchItemsByLevelIndex,
  fetchIndex,

  //UPDATE
  updateCategoryProp,
  updateCategoryValidation,
  markCategoriesPublishedBySurveyId,
  updateLevelProp,
  updateItemProp,

  //DELETE
  deleteCategory,
  deleteLevel,
  deleteLevelsByCategory,
  deleteItem,

  deleteItemLabels,
}