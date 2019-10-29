const R = require('ramda')

const ActivityLog = require('@common/activityLog/activityLog')

const { publishSurveySchemaTableProps, markSurveyDraft } = require('../../survey/repository/surveySchemaRepositoryUtils')
const ObjectUtils = require('@core/objectUtils')

const CategoryRepository = require('../repository/categoryRepository')
const CategoryValidator = require('../categoryValidator')
const Category = require('@core/survey/category')
const CategoryLevel = require('@core/survey/categoryLevel')
const Validation = require('@core/validation/validation')

const db = require('@server/db/db')
const ActivityLogRepository = require('@server/modules/activityLog/repository/activityLogRepository')

const CategoryImportSummaryGenerator = require('./categoryImportSummaryGenerator')

// ====== VALIDATION

const _validateCategoryFromCategories = async (surveyId, categories, categoryUuid, client = db) => {
  const category = R.prop(categoryUuid, categories)
  const items = await CategoryRepository.fetchItemsByCategoryUuid(surveyId, categoryUuid, true, client)
  const validation = await CategoryValidator.validateCategory(R.values(categories), category, items)
  await CategoryRepository.updateCategoryValidation(surveyId, categoryUuid, validation, client)
  return Validation.assocValidation(validation)(category)
}

const validateCategory = async (surveyId, categoryUuid, client = db) => {
  const categories = await CategoryRepository.fetchCategoriesAndLevelsBySurveyId(surveyId, true, true, client)
  return await _validateCategoryFromCategories(surveyId, categories, categoryUuid, client)
}

const validateCategories = async (surveyId, client = db) => {
  const categories = await CategoryRepository.fetchCategoriesAndLevelsBySurveyId(surveyId, true, true, client)

  const categoriesValidated = await Promise.all(Object.keys(categories).map(
    categoryUuid => _validateCategoryFromCategories(surveyId, categories, categoryUuid, client)
  ))
  return ObjectUtils.toUuidIndexedObj(categoriesValidated)
}

// ====== CREATE

const insertCategory = async (user, surveyId, category, system = false, client = db) =>
  await client.tx(async t => {
    const [categoryDb] = await Promise.all([
      CategoryRepository.insertCategory(surveyId, category, t),
      ...Category.getLevelsArray(category).map(level => insertLevel(user, surveyId, level, true, t)),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryInsert, category, system, t)
    ])

    return await validateCategory(surveyId, Category.getUuid(categoryDb), t)
  })

const insertLevel = async (user, surveyId, levelParam, system = false, client = db) =>
  await client.tx(async t => {
    const [level] = await Promise.all([
      CategoryRepository.insertLevel(surveyId, levelParam, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryLevelInsert, levelParam, system, t)
    ])
    return {
      level,
      category: await validateCategory(surveyId, CategoryLevel.getCategoryUuid(level), t)
    }
  })

const insertItem = async (user, surveyId, categoryUuid, itemParam, client = db) =>
  await client.tx(async t => {
    const [item] = await Promise.all([
      CategoryRepository.insertItem(surveyId, itemParam, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryItemInsert, itemParam, false, t)
    ])
    return {
      category: await validateCategory(surveyId, categoryUuid, t),
      item
    }
  })

/**
 * Bulk insert of category items.
 * Items can belong to different categories and validation is not performed.
 */
const insertItems = async (user, surveyId, items, client = db) =>
  await client.tx(async t => {
    const activityLogs = items.map(
      item => ActivityLog.newActivity(ActivityLog.type.categoryItemInsert, item, true)
    )
    await Promise.all([
      CategoryRepository.insertItems(surveyId, items, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insertMany(user, surveyId, activityLogs, t)
    ])
  })

// ====== UPDATE

const publishProps = async (surveyId, langsDeleted, client = db) =>
  await client.tx(async t =>
    await Promise.all([
      publishSurveySchemaTableProps(surveyId, 'category', t),
      publishSurveySchemaTableProps(surveyId, 'category_level', t),
      publishSurveySchemaTableProps(surveyId, 'category_item', t),
      CategoryRepository.markCategoriesPublishedBySurveyId(surveyId, t),
      ...langsDeleted.map(langDeleted => CategoryRepository.deleteItemLabels(surveyId, langDeleted, t))
    ])
  )

const updateCategoryProp = async (user, surveyId, categoryUuid, key, value, system = false, client = db) =>
  await client.tx(async t => {
    await Promise.all([
      CategoryRepository.updateCategoryProp(surveyId, categoryUuid, key, value, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryPropUpdate, {
        uuid: categoryUuid,
        key,
        value
      }, system, t)
    ])
    const categories = await validateCategories(surveyId, t)
    return {
      categories,
      category: R.prop(categoryUuid, categories)
    }
  })

const updateLevelProp = async (user, surveyId, categoryUuid, levelUuid, key, value, client = db) =>
  await client.tx(async t => {
    const [level] = await Promise.all([
      CategoryRepository.updateLevelProp(surveyId, levelUuid, key, value, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryLevelPropUpdate, {
        uuid: levelUuid,
        key,
        value
      }, false, t)
    ])

    return {
      level,
      category: await validateCategory(surveyId, categoryUuid, t)
    }
  })

const updateItemProp = async (user, surveyId, categoryUuid, itemUuid, key, value, client = db) =>
  await client.tx(async t => {
    const [item] = await Promise.all([
      CategoryRepository.updateItemProp(surveyId, itemUuid, key, value, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryItemPropUpdate, {
        uuid: itemUuid,
        key,
        value
      }, false, t)
    ])
    return {
      item,
      category: await validateCategory(surveyId, categoryUuid, t),
    }
  })

// ====== DELETE
const deleteCategory = async (user, surveyId, categoryUuid, client = db) =>
  await client.tx(async t => {
    await Promise.all([
      CategoryRepository.deleteCategory(surveyId, categoryUuid, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryDelete, { uuid: categoryUuid }, false, t)
    ])

    return await validateCategories(surveyId, t)
  })

const deleteLevel = async (user, surveyId, categoryUuid, levelUuid, client = db) =>
  await client.tx(async t => {
    await Promise.all([
      CategoryRepository.deleteLevel(surveyId, levelUuid, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryLevelDelete, { uuid: levelUuid }, false, t)
    ])

    return await validateCategory(surveyId, categoryUuid, t)
  })

/**
 * Deletes all levels without items.
 * Category validation is not performed
 */
const deleteLevelsEmptyByCategory = async (user, surveyId, category, client = db) =>
  await client.tx(async t => {
    const levels = Category.getLevelsArray(category)
    const levelUuidsDeleted = await CategoryRepository.deleteLevelsEmptyByCategory(surveyId, Category.getUuid(category), t)
    const logActivities = levelUuidsDeleted.map(uuid => ActivityLog.newActivity(ActivityLog.type.categoryLevelDelete, { uuid }, true))

    await Promise.all([
      ActivityLogRepository.insertMany(user, surveyId, logActivities, t),
      markSurveyDraft(surveyId, t)
    ])
    const levelsUpdated = R.reject(level => R.includes(CategoryLevel.getUuid(level), levelUuidsDeleted))(levels)
    return Category.assocLevelsArray(levelsUpdated)(category)
  })

/**
 * Deletes all levels and creates new ones with the specified names.
 * Category validation is not performed
 */
const replaceLevels = async (user, surveyId, category, levelNamesNew, client = db) =>
  await client.tx(async t => {
    const categoryUuid = Category.getUuid(category)
    const levelsNew = levelNamesNew.map((levelName, index) =>
      Category.newLevel(category, { [CategoryLevel.keysProps.name]: levelName }, index)
    )
    await Promise.all([
        CategoryRepository.deleteLevelsByCategory(surveyId, categoryUuid, t),
        ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryLevelsDelete, { uuid: categoryUuid }, true, t),
        ...levelsNew.map(level => insertLevel(user, surveyId, level, true, t)),
        markSurveyDraft(surveyId, t)
      ]
    )
    return Category.assocLevelsArray(levelsNew)(category)
  })

const deleteItem = async (user, surveyId, categoryUuid, itemUuid, client = db) =>
  await client.tx(async t => {
    await Promise.all([
      CategoryRepository.deleteItem(surveyId, itemUuid, t),
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.categoryItemDelete, { uuid: itemUuid }, false, t),
    ])

    return await validateCategory(surveyId, categoryUuid, t)
  })

module.exports = {
  //CREATE
  insertCategory,
  insertLevel,
  insertItem,
  insertItems,
  createImportSummary: CategoryImportSummaryGenerator.createImportSummary,
  createImportSummaryFromStream: CategoryImportSummaryGenerator.createImportSummaryFromStream,

  //READ
  fetchCategoriesAndLevelsBySurveyId: CategoryRepository.fetchCategoriesAndLevelsBySurveyId,
  fetchCategoryAndLevelsByUuid: CategoryRepository.fetchCategoryAndLevelsByUuid,
  fetchItemsByCategoryUuid: CategoryRepository.fetchItemsByCategoryUuid,
  fetchItemsByParentUuid: CategoryRepository.fetchItemsByParentUuid,
  fetchItemsByLevelIndex: CategoryRepository.fetchItemsByLevelIndex,

  //UPDATE
  publishProps,
  updateCategoryProp,
  updateLevelProp,
  updateItemProp,

  //DELETE
  deleteCategory,
  deleteLevel,
  deleteLevelsEmptyByCategory,
  deleteItem,

  //UTILS
  replaceLevels,
  validateCategory,
  validateCategories,
}