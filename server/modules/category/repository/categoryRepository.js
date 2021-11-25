import * as R from 'ramda'
import * as A from '@core/arena'

import {
  getSurveyDBSchema,
  updateSurveySchemaTableProp,
  deleteSurveySchemaTableRecord,
  deleteSurveySchemaTableProp,
  dbTransformCallback,
} from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as DB from '../../../db'
import { db } from '../../../db/db'
import * as DbUtils from '../../../db/dbUtils'

import * as Category from '../../../../core/survey/category'
import * as CategoryLevel from '../../../../core/survey/categoryLevel'
import * as CategoryItem from '../../../../core/survey/categoryItem'
import * as CategoryExportRepository from './categoryExportRepository'

// ============== CREATE

export const insertCategory = async ({ surveyId, category, backup = false, client = db }) => {
  const props = backup ? Category.getProps(category) : {}
  const propsDraft = backup ? Category.getPropsDraft(category) : Category.getProps(category)
  return client.one(
    `
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category (uuid, props, props_draft)
        VALUES ($1, $2, $3)
        RETURNING *`,
    [Category.getUuid(category), props, propsDraft],
    (def) => dbTransformCallback(def, true, true)
  )
}

export const insertLevel = async ({ surveyId, level, backup = false, client = db }) => {
  const props = backup ? CategoryLevel.getProps(level) : {}
  const propsDraft = backup ? CategoryLevel.getPropsDraft(level) : CategoryLevel.getProps(level)
  return client.one(
    `
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category_level (uuid, category_uuid, index, props, props_draft)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
    [Category.getUuid(level), CategoryLevel.getCategoryUuid(level), CategoryLevel.getIndex(level), props, propsDraft],
    (def) => dbTransformCallback(def, true, true)
  )
}

export const insertItem = async (surveyId, item, client = db) =>
  client.one(
    `
        INSERT INTO ${getSurveyDBSchema(surveyId)}.category_item (uuid, level_uuid, parent_uuid, props_draft)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
    [Category.getUuid(item), CategoryItem.getLevelUuid(item), CategoryItem.getParentUuid(item), item.props],
    (def) => dbTransformCallback(def, true, true)
  )

export const insertItems = async ({ surveyId, items, backup = false }, client = db) => {
  const values = items.map((item) => [
    CategoryItem.getUuid(item),
    CategoryItem.getLevelUuid(item),
    CategoryItem.getParentUuid(item),
    backup ? CategoryItem.getProps(item) : {},
    backup ? CategoryItem.getPropsDraft(item) : CategoryItem.getProps(item),
  ])

  await client.none(
    DbUtils.insertAllQuery(
      getSurveyDBSchema(surveyId),
      'category_item',
      ['uuid', 'level_uuid', 'parent_uuid', 'props', 'props_draft'],
      values
    )
  )
}

// ============== READ

const _getFetchCategoriesAndLevelsQuery = ({
  surveyId,
  draft,
  includeValidation,
  backup = false,
  offset = null,
  limit = null,
}) => {
  const propsFields = (tableAlias) => {
    if (backup) {
      // keep both props and propsDraft
      return `'props', ${tableAlias}.props,
              'propsDraft', ${tableAlias}.props_draft`
    }
    // combine props and props_draft column into one
    return `'props', ${tableAlias}.props${draft ? ` || ${tableAlias}.props_draft` : ''}`
  }

  return `
    WITH
      levels AS
      (
        SELECT
          l.category_uuid,
          json_object_agg(l.index::text, json_build_object(
            'id', l.id, 
            'uuid', l.uuid, 
            'index', l.index, 
            ${propsFields('l')}
          )) AS levels
        FROM
          ${getSurveyDBSchema(surveyId)}.category_level l
        GROUP BY
          l.category_uuid
      ),
      c AS
      (
        SELECT * 
        FROM ${getSurveyDBSchema(surveyId)}.category
        ORDER BY (props || props_draft) -> '${Category.keysProps.name}'
        ${offset ? 'OFFSET $/offset/' : ''}
        ${limit ? 'LIMIT $/limit/' : ''}
      )
    
    SELECT
      json_object_agg(c.uuid, json_build_object( 
      'id', c.id,
      'uuid', c.uuid,
      ${propsFields('c')},
      'published', c.published, 
      'levels', l.levels
      ${includeValidation ? ", 'validation', c.validation" : ''}
      )) AS categories
    FROM c
    JOIN
      levels l
    ON
      c.uuid = l.category_uuid
    ${backup || draft ? '' : `WHERE c.published`}`
}

export const countCategories = async ({ surveyId, draft = false }, client = db) =>
  client.one(
    `SELECT COUNT(*) 
     FROM ${getSurveyDBSchema(surveyId)}.category
     ${draft ? '' : `WHERE props::text <> '{}'::text`}`,
    [],
    (r) => parseInt(r.count, 10)
  )

export const fetchCategoriesBySurveyId = async (
  { surveyId, draft = false, includeValidation = false, offset = 0, limit = null, search = null },
  client = db
) => {
  const schema = getSurveyDBSchema(surveyId)
  const nameColumn = DbUtils.getPropColCombined(Category.keysProps.name, draft, 'c.')
  return client.map(
    `SELECT 
      c.id,
      c.uuid,
      c.props,
      c.props_draft,
      c.published,
      (SELECT COUNT(*) FROM ${schema}.category_level l WHERE l.category_uuid = c.uuid) AS levels_count
      ${includeValidation ? ', c.validation' : ''}
    FROM ${schema}.category c
    ${search ? `WHERE ${nameColumn} ILIKE $/search/` : ''} 
    ORDER BY ${nameColumn}
    LIMIT ${limit ? `$/limit/` : 'ALL'}
    ${A.isNull(offset) ? '' : 'OFFSET $/offset/'}`,
    {
      offset,
      limit,
      search: `%${search}%`,
    },
    (row) => DB.transformCallback(row, draft, true)
  )
}

export const fetchCategoriesAndLevelsBySurveyId = async (
  { surveyId, draft = false, includeValidation = false, backup = false, offset = 0, limit = null },
  client = db
) => {
  const { categories } = await client.one(
    _getFetchCategoriesAndLevelsQuery({ surveyId, draft, includeValidation, backup, offset, limit }),
    {
      offset,
      limit,
    }
  )
  return categories || {}
}

export const fetchCategoryAndLevelsByUuid = async (
  { surveyId, categoryUuid, draft = false, includeValidation = false, backup = false },
  client = db
) => {
  const { categories } = await client.one(
    `${_getFetchCategoriesAndLevelsQuery({ surveyId, draft: true, includeValidation, backup })} 
    ${backup || draft ? 'WHERE' : 'AND'} c.uuid = $1`,
    [categoryUuid]
  )
  return A.pipe(R.values, R.head)(categories)
}

export const fetchItemsByCategoryUuid = async (
  { surveyId, categoryUuid, draft = false, backup = false },
  client = db
) => {
  const items = await client.map(
    `
      SELECT i.* 
      FROM ${getSurveyDBSchema(surveyId)}.category_item i
      JOIN ${getSurveyDBSchema(surveyId)}.category_level l 
        ON l.uuid = i.level_uuid
        AND l.category_uuid = $1
     ORDER BY i.id
    `,
    [categoryUuid],
    (def) => DB.transformCallback(def, draft, true, backup)
  )

  return backup || draft ? items : R.filter((item) => item.published)(items)
}

export const countItemsByCategoryUuid = async (surveyId, categoryUuid, client = db) =>
  client.one(
    `SELECT COUNT(*) 
    FROM ${getSurveyDBSchema(surveyId)}.category_item i
     JOIN ${getSurveyDBSchema(surveyId)}.category_level l 
        ON l.uuid = i.level_uuid
        AND l.category_uuid = $1`,
    [categoryUuid],
    (r) => parseInt(r.count, 10)
  )

export const countItemsByLevelUuid = async ({ surveyId, levelUuid }, client = db) =>
  client.one(
    `SELECT COUNT(*) 
    FROM ${getSurveyDBSchema(surveyId)}.category_item i
    WHERE i.level_uuid = $1`,
    [levelUuid],
    (r) => parseInt(r.count, 10)
  )

export const fetchItemsByParentUuid = async (surveyId, categoryUuid, parentUuid = null, draft = false, client = db) => {
  const items = await client.map(
    `
    SELECT i.* 
    FROM ${getSurveyDBSchema(surveyId)}.category_item i
    JOIN ${getSurveyDBSchema(surveyId)}.category_level l 
      ON l.uuid = i.level_uuid
    WHERE l.category_uuid = $1 
      AND i.parent_uuid ${parentUuid ? `= '${parentUuid}'` : 'IS NULL'}
    ORDER BY i.id
  `,
    [categoryUuid],
    (def) => dbTransformCallback(def, draft, true)
  )

  return draft ? items : R.filter((item) => item.published)(items)
}

export const countItemsByLevelIndex = async ({ surveyId, categoryUuid, levelIndex, draft = false }, client = db) =>
  client.one(
    `SELECT COUNT(i.*) 
     FROM ${getSurveyDBSchema(surveyId)}.category_item i
       JOIN ${getSurveyDBSchema(surveyId)}.category_level l 
         ON l.uuid = i.level_uuid
     WHERE l.category_uuid = $/categoryUuid/
       AND l.index = $/levelIndex/`,
    { categoryUuid, levelIndex },
    (row) => Number(row.count)
  )

export const fetchItemsByLevelIndex = async (
  { surveyId, categoryUuid, levelIndex, limit = null, offset = null, draft = false },
  client = db
) => {
  const schema = getSurveyDBSchema(surveyId)

  // join category_item table to get ancestors codes
  const ancestorLevelIndexes = levelIndex > 0 ? [...Array(levelIndex).keys()] : []
  const codesSelectFields = ancestorLevelIndexes.map((ancstorLevelIdx) =>
    DbUtils.getPropColCombined(
      CategoryItem.keysProps.code,
      draft,
      `i${ancstorLevelIdx}.`,
      true,
      `level_${ancstorLevelIdx}_code`
    )
  )
  const ancestorItemsJoins = ancestorLevelIndexes.reduce(
    (joinConditionsAcc, ancstorLevelIdx) => [
      ...joinConditionsAcc,
      `JOIN ${schema}.category_item i${ancstorLevelIdx} 
        ON i${ancstorLevelIdx}.uuid = i${ancstorLevelIdx + 1}.parent_uuid`,
    ],
    []
  )
  return client.map(
    `SELECT i${levelIndex}.* ${codesSelectFields.length > 0 ? `, ${codesSelectFields.join(', ')}` : ''}
     FROM ${schema}.category_item i${levelIndex}
       JOIN ${schema}.category_level l 
         ON l.uuid = i${levelIndex}.level_uuid
      ${ancestorItemsJoins.join(' ')}
     WHERE l.category_uuid = $/categoryUuid/
       AND l.index = $/levelIndex/
    ${limit ? `LIMIT $/limit/` : ''}
    ${A.isNull(offset) ? '' : 'OFFSET $/offset/'}`,
    { categoryUuid, levelIndex, limit, offset },
    (item) => dbTransformCallback(item, draft, true)
  )
}

export const fetchIndex = async (surveyId, draft = false, client = db) =>
  client.map(
    `
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
    (indexItem) => dbTransformCallback(indexItem, draft, true)
  )

export const getCategoryStreamAndHeaders = ({ surveyId, categoryUuid, levels, languages, category }) => {
  const headers = CategoryExportRepository.getCategoryExportHeaders({ levels, languages, category })
  const extraPropsHeaders = CategoryExportRepository.getCategoryExportHeadersExtraProps({ levels, languages, category })

  const query = CategoryExportRepository.generateCategoryExportQuery({
    surveyId,
    categoryUuid,
    levels,
    headers,
    extraPropsHeaders,
    languages,
  })

  const stream = new DbUtils.QueryStream(DbUtils.formatQuery(query, [categoryUuid]))
  return { stream, headers, extraPropsHeaders }
}

export const { writeCategoryExportTemplateToStream } = CategoryExportRepository

// ============== UPDATE

export const updateCategoryProp = async (surveyId, categoryUuid, key, value, client = db) =>
  updateSurveySchemaTableProp(surveyId, 'category', categoryUuid, key, value, client)

export const updateCategoryValidation = async (surveyId, categoryUuid, validation, client = db) =>
  client.none(
    `
      UPDATE ${getSurveyDBSchema(surveyId)}.category 
      SET validation = $1::jsonb 
      WHERE uuid = $2
    `,
    [validation, categoryUuid]
  )

export const markCategoriesPublishedBySurveyId = async (surveyId, client = db) =>
  client.any(`
      UPDATE ${getSurveyDBSchema(surveyId)}.category
      SET published = true
  `)

export const updateLevelProp = async (surveyId, levelUuid, key, value, client = db) =>
  updateSurveySchemaTableProp(surveyId, 'category_level', levelUuid, key, value, client)

export const updateItemProp = async (surveyId, itemUuid, key, value, client = db) =>
  updateSurveySchemaTableProp(surveyId, 'category_item', itemUuid, key, value, client)

export const updateItems = async (surveyId, items, client = db) => {
  const values = items.map((item) => [CategoryItem.getUuid(item), CategoryItem.getProps(item)])
  await client.none(
    DbUtils.updateAllQuery(
      getSurveyDBSchema(surveyId),
      'category_item',
      { name: 'uuid', cast: 'uuid' },
      [{ name: 'props_draft', cast: 'jsonb' }],
      values
    )
  )
}

// ============== DELETE

export const deleteCategory = async (surveyId, categoryUuid, client = db) =>
  deleteSurveySchemaTableRecord(surveyId, 'category', categoryUuid, client)

export const deleteLevel = async (surveyId, levelUuid, client = db) =>
  deleteSurveySchemaTableRecord(surveyId, 'category_level', levelUuid, client)

export const deleteLevelsByCategory = async (surveyId, categoryUuid, client = db) =>
  client.none(
    `
      DELETE FROM ${getSurveyDBSchema(surveyId)}.category_level 
      WHERE category_uuid = $1
    `,
    [categoryUuid]
  )

export const deleteLevelsEmptyByCategory = async (surveyId, categoryUuid, client = db) =>
  client.map(
    `
      DELETE FROM ${getSurveyDBSchema(surveyId)}.category_level l
      WHERE 
        l.category_uuid = $1
        AND NOT EXISTS (
          SELECT i.uuid 
          FROM ${getSurveyDBSchema(surveyId)}.category_item i
          WHERE i.level_uuid = l.uuid
        )
      RETURNING l.uuid
    `,
    [categoryUuid],
    R.prop('uuid')
  )

export const deleteItem = async (surveyId, itemUuid, client = db) =>
  deleteSurveySchemaTableRecord(surveyId, 'category_item', itemUuid, client)

export const deleteItemLabels = async (surveyId, langCode, client = db) =>
  deleteSurveySchemaTableProp(surveyId, 'category_item', ['labels', langCode], client)
