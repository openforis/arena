import * as R from 'ramda'
import * as pgPromise from 'pg-promise'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as ObjectUtils from '@core/objectUtils'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import {
  publishSurveySchemaTableProps,
  markSurveyDraft,
} from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as CategoryValidator from '../categoryValidator'
import * as CategoryImportSummaryGenerator from './categoryImportSummaryGenerator'
import * as CategoryRepository from '../repository/categoryRepository'

// ====== VALIDATION

const _validateCategoryFromCategories = async (surveyId, categories, categoryUuid, client = db) => {
  const category = R.prop(categoryUuid, categories)
  const items = await CategoryRepository.fetchItemsByCategoryUuid(surveyId, categoryUuid, true, client)
  const validation = await CategoryValidator.validateCategory(R.values(categories), category, items)
  await CategoryRepository.updateCategoryValidation(surveyId, categoryUuid, validation, client)
  return Validation.assocValidation(validation)(category)
}

export const validateCategory = async (surveyId, categoryUuid, client = db) => {
  const categories = await CategoryRepository.fetchCategoriesAndLevelsBySurveyId(
    { surveyId, draft: true, includeValidation: true },
    client
  )
  return _validateCategoryFromCategories(surveyId, categories, categoryUuid, client)
}

export const validateCategories = async (surveyId, client = db) => {
  const categories = await CategoryRepository.fetchCategoriesAndLevelsBySurveyId(
    { surveyId, draft: true, includeValidation: true },
    client
  )

  const categoriesValidated = await Promise.all(
    Object.keys(categories).map((categoryUuid) =>
      _validateCategoryFromCategories(surveyId, categories, categoryUuid, client)
    )
  )
  return ObjectUtils.toUuidIndexedObj(categoriesValidated)
}

// ====== CREATE

export const insertLevel = async ({ user, surveyId, level: levelParam, system = false, addLogs = true }, client = db) =>
  client.tx(async (t) => {
    const [level] = await Promise.all([
      CategoryRepository.insertLevel(surveyId, levelParam, t),
      markSurveyDraft(surveyId, t),
      ...(addLogs
        ? [ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryLevelInsert, levelParam, system, t)]
        : []),
    ])
    return {
      level,
      category: await validateCategory(surveyId, CategoryLevel.getCategoryUuid(level), t),
    }
  })

export const insertCategory = async ({ user, surveyId, category, system = false, addLogs = true }, client = db) =>
  client.tx(async (t) => {
    const [categoryDb] = await Promise.all([
      CategoryRepository.insertCategory(surveyId, category, t),
      ...Category.getLevelsArray(category).map((level) =>
        insertLevel({ user, surveyId, level, system: true, addLogs }, t)
      ),
      markSurveyDraft(surveyId, t),
      ...(addLogs
        ? [ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryInsert, category, system, t)]
        : []),
    ])

    return validateCategory(surveyId, Category.getUuid(categoryDb), t)
  })

export const insertItem = async (user, surveyId, categoryUuid, itemParam, client = db) =>
  client.tx(async (t) => {
    const logContent = {
      ...itemParam,
      [ActivityLog.keysContent.categoryUuid]: categoryUuid,
    }
    const [item] = await Promise.all([
      CategoryRepository.insertItem(surveyId, itemParam, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryItemInsert, logContent, false, t),
    ])
    return {
      category: await validateCategory(surveyId, categoryUuid, t),
      item,
    }
  })

/**
 * Bulk insert of category items.
 * Items can belong to different categories and validation is not performed.
 *
 * @param {!object} user - The user performing this operation.
 * @param {!number} surveyId - The id of the survey.
 * @param {!any} items - Category items to be inserted.
 * @param {pgPromise.IDatabase} client - The database client.
 */
export const insertItems = async (user, surveyId, items, client = db) =>
  client.tx(async (t) => {
    const activityLogs = items.map((item) => ActivityLog.newActivity(ActivityLog.type.categoryItemInsert, item, true))
    await Promise.all([
      CategoryRepository.insertItems(surveyId, items, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insertMany(user, surveyId, activityLogs, t),
    ])
  })

export const { createImportSummary, createImportSummaryFromStream } = CategoryImportSummaryGenerator

// ====== READ
export const {
  countCategories,
  countItemsByCategoryUuid,
  fetchCategoriesBySurveyId,
  fetchCategoriesAndLevelsBySurveyId,
  fetchCategoryAndLevelsByUuid,
  getCategoryStreamAndHeaders,
  fetchItemsByParentUuid,
  fetchItemsByLevelIndex,
  fetchItemsByCategoryUuid,
  getCategoryExportTemplate,
  insertItems: insertItemsInBatch,
} = CategoryRepository

// ====== UPDATE

export const publishProps = async (surveyId, langsDeleted, client = db) =>
  client.tx(async (t) =>
    Promise.all([
      publishSurveySchemaTableProps(surveyId, 'category', t),
      publishSurveySchemaTableProps(surveyId, 'category_level', t),
      publishSurveySchemaTableProps(surveyId, 'category_item', t),
      CategoryRepository.markCategoriesPublishedBySurveyId(surveyId, t),
      ...langsDeleted.map((langDeleted) => CategoryRepository.deleteItemLabels(surveyId, langDeleted, t)),
    ])
  )

export const updateCategoryProp = async (user, surveyId, categoryUuid, key, value, system = false, client = db) =>
  client.tx(async (t) => {
    await Promise.all([
      CategoryRepository.updateCategoryProp(surveyId, categoryUuid, key, value, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(
        user,
        surveyId,
        ActivityLog.type.categoryPropUpdate,
        {
          [ActivityLog.keysContent.uuid]: categoryUuid,
          [ActivityLog.keysContent.key]: key,
          [ActivityLog.keysContent.value]: value,
        },
        system,
        t
      ),
    ])
    return validateCategory(surveyId, categoryUuid, t)
  })

export const updateLevelProp = async (user, surveyId, categoryUuid, levelUuid, key, value, client = db) =>
  client.tx(async (t) => {
    const [level] = await Promise.all([
      CategoryRepository.updateLevelProp(surveyId, levelUuid, key, value, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(
        user,
        surveyId,
        ActivityLog.type.categoryLevelPropUpdate,
        {
          [ActivityLog.keysContent.uuid]: levelUuid,
          [ActivityLog.keysContent.categoryUuid]: categoryUuid,
          [ActivityLog.keysContent.key]: key,
          [ActivityLog.keysContent.value]: value,
        },
        false,
        t
      ),
    ])

    return {
      level,
      category: await validateCategory(surveyId, categoryUuid, t),
    }
  })

const _newCategoryItemUpdateLogActivity = (categoryUuid, item, key, value, system) =>
  ActivityLog.newActivity(
    ActivityLog.type.categoryItemPropUpdate,
    {
      [ActivityLog.keysContent.uuid]: CategoryItem.getUuid(item),
      [ActivityLog.keysContent.code]: CategoryItem.getCode(item),
      [ActivityLog.keysContent.categoryUuid]: categoryUuid,
      [ActivityLog.keysContent.levelUuid]: CategoryItem.getLevelUuid(item),
      [ActivityLog.keysContent.key]: key,
      [ActivityLog.keysContent.value]: value,
    },
    system
  )

export const updateItemProp = async (user, surveyId, categoryUuid, itemUuid, key, value, client = db) =>
  client.tx(async (t) => {
    const item = await CategoryRepository.updateItemProp(surveyId, itemUuid, key, value, t)
    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insertMany(
        user,
        surveyId,
        [_newCategoryItemUpdateLogActivity(categoryUuid, item, key, value, false)],
        t
      ),
    ])

    return {
      item,
      category: await validateCategory(surveyId, categoryUuid, t),
    }
  })

export const updateItemsExtra = async (user, surveyId, categoryUuid, items, client = db) =>
  client.tx(async (t) => {
    const logActivities = items.map((item) =>
      _newCategoryItemUpdateLogActivity(
        categoryUuid,
        item,
        CategoryItem.keysProps.extra,
        CategoryItem.getExtra(item),
        true
      )
    )
    await Promise.all([
      ActivityLogRepository.insertMany(user, surveyId, logActivities, t),
      CategoryRepository.updateItems(surveyId, items, t),
    ])
  })

// ====== DELETE
export const deleteCategory = async (user, surveyId, categoryUuid, client = db) =>
  client.tx(async (t) => {
    const category = await CategoryRepository.deleteCategory(surveyId, categoryUuid, t)

    const logContent = {
      [ActivityLog.keysContent.uuid]: categoryUuid,
      [ActivityLog.keysContent.categoryName]: Category.getName(category),
    }

    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryDelete, logContent, false, t),
    ])

    return null
  })

export const deleteLevel = async (user, surveyId, categoryUuid, levelUuid, client = db) =>
  client.tx(async (t) => {
    const levelDeleted = await CategoryRepository.deleteLevel(surveyId, levelUuid, t)

    const logContent = {
      [ActivityLog.keysContent.uuid]: levelUuid,
      [ActivityLog.keysContent.index]: CategoryLevel.getIndex(levelDeleted),
      [ActivityLog.keysContent.categoryUuid]: categoryUuid,
    }

    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryLevelDelete, logContent, false, t),
    ])

    return validateCategory(surveyId, categoryUuid, t)
  })

/**
 * Deletes all levels without items.
 * Category validation is not performed.
 *
 * @param {!object} user - The user performing this operation.
 * @param {!number} surveyId - The id of the survey.
 * @param {!object} category - The category to filter by.
 * @param {pgPromise.IDatabase} client - The database client.
 */
export const deleteLevelsEmptyByCategory = async (user, surveyId, category, client = db) =>
  client.tx(async (t) => {
    const levels = Category.getLevelsArray(category)
    const levelUuidsDeleted = await CategoryRepository.deleteLevelsEmptyByCategory(
      surveyId,
      Category.getUuid(category),
      t
    )
    const logActivities = levelUuidsDeleted.map((uuid) =>
      ActivityLog.newActivity(ActivityLog.type.categoryLevelDelete, { [ActivityLog.keysContent.uuid]: uuid }, true)
    )
    await Promise.all([
      ActivityLogRepository.insertMany(user, surveyId, logActivities, t),
      markSurveyDraft(surveyId, t),
    ])
    const levelsUpdated = R.reject((level) => R.includes(CategoryLevel.getUuid(level), levelUuidsDeleted))(levels)
    return Category.assocLevelsArray(levelsUpdated)(category)
  })

/**
 * Deletes all levels and creates new ones with the specified names.
 * Category validation is not performed.
 *
 * @param {!object} user - The user performing this operation.
 * @param {!number} surveyId - The id of the survey.
 * @param {!object} category - The category of interest.
 * @param {string[]} levelNamesNew - Array of new level names.
 * @param {pgPromise.IDatabase} client - The database client.
 *
 */
export const replaceLevels = async (user, surveyId, category, levelNamesNew, client = db) =>
  client.tx(async (t) => {
    const categoryUuid = Category.getUuid(category)
    const levelsNew = levelNamesNew.map((levelName, index) =>
      Category.newLevel(category, { [CategoryLevel.keysProps.name]: levelName }, index)
    )
    const logContent = {
      [ActivityLog.keysContent.uuid]: categoryUuid,
    }
    await Promise.all([
      CategoryRepository.deleteLevelsByCategory(surveyId, categoryUuid, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryLevelsDelete, logContent, true, t),
      ...levelsNew.map((level) => insertLevel(user, surveyId, level, true, t)),
      markSurveyDraft(surveyId, t),
    ])
    return Category.assocLevelsArray(levelsNew)(category)
  })

export const deleteItem = async (user, surveyId, categoryUuid, itemUuid, client = db) =>
  client.tx(async (t) => {
    const item = await CategoryRepository.deleteItem(surveyId, itemUuid, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: itemUuid,
      [ActivityLog.keysContent.categoryUuid]: categoryUuid,
      [ActivityLog.keysContent.levelUuid]: CategoryItem.getLevelUuid(item),
      [ActivityLog.keysContent.code]: CategoryItem.getCode(item),
    }
    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryItemDelete, logContent, false, t),
    ])

    return validateCategory(surveyId, categoryUuid, t)
  })
