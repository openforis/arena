import * as R from 'ramda'
import * as pgPromise from 'pg-promise'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as ObjectUtils from '@core/objectUtils'
import * as PromiseUtils from '@core/promiseUtils'
import * as StringUtils from '@core/stringUtils'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import { CategoryItemExtraDef } from '@core/survey/categoryItemExtraDef'
import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import {
  publishSurveySchemaTableProps,
  markSurveyDraft,
} from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as CSVWriter from '@server/utils/file/csvWriter'
import * as CategoryValidator from '../categoryValidator'
import * as CategoryImportSummaryGenerator from './categoryImportSummaryGenerator'
import * as CategoryRepository from '../repository/categoryRepository'
import { validateCategoryItemExtraDef } from '@core/survey/categoryItemExtraDefValidator'

// ====== VALIDATION

const _validateCategoryFromCategories = async (surveyId, categories, categoryUuid, client = db) => {
  const category = R.prop(categoryUuid, categories)
  const items = await CategoryRepository.fetchItemsByCategoryUuid({ surveyId, categoryUuid, draft: true }, client)
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

const _insertLevelInTransaction = async ({
  user,
  surveyId,
  level: levelParam,
  system,
  addLogs,
  validate,
  backup,
  t,
}) => {
  const [level] = await Promise.all([
    CategoryRepository.insertLevel({ surveyId, level: levelParam, backup, client: t }),
    markSurveyDraft(surveyId, t),
    ...(addLogs
      ? [ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryLevelInsert, levelParam, system, t)]
      : []),
  ])
  return {
    level,
    category: validate ? await validateCategory(surveyId, CategoryLevel.getCategoryUuid(level), t) : null,
  }
}

export const insertLevel = async (
  { user, surveyId, level, system = false, addLogs = true, validate = true },
  client = db
) => client.tx(async (t) => _insertLevelInTransaction({ user, surveyId, level, system, addLogs, validate, t }))

export const insertCategory = async (
  { user, surveyId, category, system = false, addLogs = true, validate = true, backup = false },
  client = db
) =>
  client.tx(async (t) => {
    const [categoryDb] = await Promise.all([
      CategoryRepository.insertCategory({ surveyId, category, backup, client: t }),
      ...Category.getLevelsArray(category).map((level) =>
        _insertLevelInTransaction({ user, surveyId, level, system: true, addLogs, validate, backup, t })
      ),
      markSurveyDraft(surveyId, t),
      ...(addLogs
        ? [ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryInsert, category, system, t)]
        : []),
    ])

    return validate ? validateCategory(surveyId, Category.getUuid(categoryDb), t) : categoryDb
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
 * @returns {Promise<*>} - The result promise (void).
 */
export const insertItems = async (user, surveyId, items, client = db) =>
  client.tx(async (t) => {
    const activityLogs = items.map((item) => ActivityLog.newActivity(ActivityLog.type.categoryItemInsert, item, true))
    await Promise.all([
      CategoryRepository.insertItems({ surveyId, items }, t),
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
  fetchItemsByParentUuid,
  countItemsByLevelIndex,
  fetchItemsByLevelIndex,
  fetchItemsByCategoryUuid,
  insertItems: insertItemsInBatch,
} = CategoryRepository

export const exportCategoryToStream = async ({ surveyId, categoryUuid, draft, outputStream }, client = db) => {
  const category = await fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })

  // get survey languages
  const surveyInfo = await SurveyRepository.fetchSurveyById({ surveyId, draft })
  const languages = Survey.getLanguages(surveyInfo)

  const { stream: categoryStream, headers } = CategoryRepository.generateCategoryExportStreamAndHeaders({
    surveyId,
    category,
    languages,
  })

  return client.stream(categoryStream, (dbStream) => {
    dbStream.pipe(CSVWriter.transformToStream(outputStream, headers))
  })
}

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

export const updateCategoryProp = async ({ user, surveyId, categoryUuid, key, value, system = false }, client = db) =>
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

const _updateCategoryItemsExtraDef = async ({ surveyId, categoryUuid, name, itemExtraDef, deleted }, t) => {
  const items = await CategoryRepository.fetchItemsByCategoryUuid({ surveyId, categoryUuid, draft: true }, t)
  const itemsUpdated = items.reduce((acc, item) => {
    if (R.isNil(CategoryItem.getExtraProp(name)(item))) {
      return acc
    }
    const itemUpdated = deleted
      ? CategoryItem.dissocExtraProp(name)(item)
      : CategoryItem.renameExtraProp({ nameOld: name, nameNew: CategoryItemExtraDef.getName(itemExtraDef) })(item)

    return [...acc, itemUpdated]
  }, [])

  if (itemsUpdated.length > 0) {
    await CategoryRepository.updateItems(surveyId, itemsUpdated, t)
  }
}

export const updateCategoryItemExtraDefItem = async (
  { user, surveyId, categoryUuid, name, itemExtraDef = null, deleted = false },
  client = db
) =>
  client.tx(async (t) => {
    const category = await CategoryRepository.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft: true }, t)

    // validate new item extra def
    let itemExtraDefsArrayUpdated = [...Category.getItemExtraDefsArray(category)]
    // remove old item
    itemExtraDefsArrayUpdated = itemExtraDefsArrayUpdated.filter((item) => CategoryItemExtraDef.getName(item) !== name)

    if (!deleted) {
      // add new extra def item
      itemExtraDefsArrayUpdated.push(itemExtraDef)

      const validation = await validateCategoryItemExtraDef({
        itemExtraDef,
        itemExtraDefsArray: itemExtraDefsArrayUpdated,
      })
      if (!Validation.isValid(validation)) {
        throw new Error('Invalid category item extra def')
      }
    }

    // update category items
    if (deleted || name !== CategoryItemExtraDef.getName(itemExtraDef)) {
      await _updateCategoryItemsExtraDef({ surveyId, categoryUuid, name, itemExtraDef, deleted }, t)
    }

    // prepare itemExtraDefs for storage
    // - remove unnecessary information (uuid, name)
    // - index stored object by extra def name
    const itemExtraDefsToStore = itemExtraDefsArrayUpdated.reduce(
      (acc, item) => ({
        ...acc,
        [CategoryItemExtraDef.getName(item)]: CategoryItemExtraDef.newItem({
          dataType: CategoryItemExtraDef.getDataType(item),
        }),
      }),
      {}
    )

    return updateCategoryProp(
      {
        user,
        surveyId,
        categoryUuid,
        key: Category.keysProps.itemExtraDef,
        value: itemExtraDefsToStore,
        system: true,
      },
      t
    )
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

export const cleanupCategory = async ({ user, surveyId, categoryUuid }, client = db) =>
  client.tx(async (t) => {
    const category = await CategoryRepository.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft: true })
    const levels = Category.getLevelsArray(category)
    const firstLevel = levels[0]

    // delete category, if empty
    const categoryIsEmpty =
      StringUtils.isBlank(Category.getName(category)) &&
      (await CategoryRepository.countItemsByLevelUuid({ surveyId, levelUuid: firstLevel.uuid })) === 0
    if (categoryIsEmpty) {
      await deleteCategory(user, surveyId, categoryUuid, t)
      return { deleted: true }
    }

    // delete empty levels
    let followingLevelIsNotEmpty = true
    let updated = false
    const levelsToCheck = levels.slice(1)
    levelsToCheck.reverse()

    await PromiseUtils.each(levelsToCheck, async (level) => {
      if (followingLevelIsNotEmpty) {
        if ((await CategoryRepository.countItemsByLevelUuid({ surveyId, levelUuid: level.uuid })) === 0) {
          await deleteLevel(user, surveyId, categoryUuid, level.uuid)
          updated = true
        } else {
          // breaks the loop
          followingLevelIsNotEmpty = false
        }
      }
    })
    return { updated }
  })

export const convertCategoryToReportingData = async ({ user, surveyId, categoryUuid }, client = db) =>
  client.tx(async (t) => {
    const category = await CategoryRepository.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft: true })

    // mark as reporting data
    let categoryUpdated = Category.assocProp({ key: Category.keysProps.reportingData, value: true })(category)

    await CategoryRepository.updateCategoryProp(surveyId, categoryUuid, Category.keysProps.reportingData, true, t)

    // add 'area' extra def
    const itemExtraDef = Category.getItemExtraDef(categoryUpdated)
    const itemExtraDefUpdated = {
      ...itemExtraDef,
      [Category.reportingDataItemExtraDefKeys.area]: CategoryItemExtraDef.newItem({
        dataType: CategoryItemExtraDef.dataTypes.number,
      }),
    }
    categoryUpdated = Category.assocItemExtraDef(itemExtraDefUpdated)(categoryUpdated)

    await CategoryRepository.updateCategoryProp(
      surveyId,
      categoryUuid,
      Category.keysProps.itemExtraDef,
      itemExtraDefUpdated,
      t
    )

    // update levels name
    const levels = Category.getLevelsArray(category)

    const levelsUpdated = await Promise.all(
      levels.map(async (level, index) => {
        const levelNameNew = `level_${index + 1}`
        await CategoryRepository.updateLevelProp(
          surveyId,
          CategoryLevel.getUuid(level),
          CategoryLevel.keysProps.name,
          levelNameNew,
          t
        )
        return CategoryLevel.assocProp({ key: CategoryLevel.keysProps.name, value: levelNameNew })(level)
      })
    )
    categoryUpdated = Category.assocLevelsArray(levelsUpdated)(categoryUpdated)

    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(
        user,
        surveyId,
        ActivityLog.type.categoryConvertToReportingData,
        {
          [ActivityLog.keysContent.uuid]: categoryUuid,
        },
        false,
        t
      ),
    ])
    return categoryUpdated
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
 * @returns {Promise<Category>} - Category with updated levels.
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
 * @returns {Promise<Category>} - Category with updated levels.
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
      ...levelsNew.map((level) => _insertLevelInTransaction({ user, surveyId, level, system: true, t })),
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
