const R = require('ramda')

const db = require('../../../db/db')

const { publishSurveySchemaTableProps, markSurveyDraft } = require('../../survey/repository/surveySchemaRepositoryUtils')
const ObjectUtils = require('../../../../common/objectUtils')

const CategoryRepository = require('../repository/categoryRepository')
const CategoryValidator = require('../categoryValidator')
const Category = require('../../../../common/survey/category')
const CategoryLevel = require('../../../../common/survey/categoryLevel')
const Validation = require('../../../../common/validation/validation')

const ActivityLog = require('../../activityLog/activityLogger')

const CategoryImportCSVParser = require('./categoryImportCSVParser')

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

const insertCategory = async (user, surveyId, category, client = db) =>
  await client.tx(async t => {
    const [categoryDb] = await Promise.all([
      CategoryRepository.insertCategory(surveyId, category, t),
      ...Category.getLevelsArray(category).map(level => CategoryRepository.insertLevel(surveyId, level, t)),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryInsert, category, t)
    ])

    return await validateCategory(surveyId, Category.getUuid(categoryDb), t)
  })

const insertLevel = async (user, surveyId, levelParam, client = db) =>
  await client.tx(async t => {
    const [level] = await Promise.all([
      CategoryRepository.insertLevel(surveyId, levelParam, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelInsert, levelParam, t)
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
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryItemInsert, itemParam, t)
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
    const activityLogs = items.map(item => ({
        type: ActivityLog.type.categoryItemInsert,
        params: item
      })
    )
    await Promise.all([
      CategoryRepository.insertItems(surveyId, items, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.logMany(user, surveyId, activityLogs, t)
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

const updateCategoryProp = async (user, surveyId, categoryUuid, key, value, client = db) =>
  await client.tx(async t => {
    await Promise.all([
      CategoryRepository.updateCategoryProp(surveyId, categoryUuid, key, value, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryPropUpdate, { categoryUuid, key, value }, t)
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
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelPropUpdate, { levelUuid, key, value }, t)
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
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryItemPropUpdate, { itemUuid, key, value }, t)
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
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryDelete, { categoryUuid }, t)
    ])

    return await validateCategories(surveyId, t)
  })

const deleteLevel = async (user, surveyId, categoryUuid, levelUuid, client = db) =>
  await client.tx(async t => {
    await Promise.all([
      CategoryRepository.deleteLevel(surveyId, levelUuid, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelDelete, { levelUuid }, t)
    ])

    return await validateCategory(surveyId, categoryUuid, t)
  })

/**
 * Deletes all levels in the category.
 * Category validation is not performed
 */
const deleteLevelsByCategory = async (user, surveyId, category, client = db) =>
  await client.tx(async t => {
    const categoryUuid = Category.getUuid(category)
    await Promise.all([
      CategoryRepository.deleteLevelsByCategory(surveyId, categoryUuid, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelsDelete, { categoryUuid }, t)
    ])
    return Category.assocLevelsArray([])(category)
  })

/**
 * Deletes all levels in the category starting from the specified index.
 * Category validation is not performed
 */
const deleteLevelsFromIndex = async (user, surveyId, category, fromIndex, client = db) =>
  await client.tx(async t => {
    const levels = Category.getLevelsArray(category)

    await Promise.all([
      ...levels.slice(fromIndex).reduce((acc, level) => {
          const levelUuid = CategoryLevel.getUuid(level)
          acc.push(
            CategoryRepository.deleteLevel(surveyId, levelUuid, t),
            ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelDelete, { levelUuid }, t)
          )
          return acc
        },
        []
      ),
      markSurveyDraft(surveyId, t)
    ])
    return Category.assocLevelsArray(levels.slice(0, fromIndex))(category)
  })

/**
 * Deletes all levels and creates new ones with the specified names.
 * Category validation is not performed
 */
const replaceLevels = async (user, surveyId, category, levelNamesNew, client = db) =>
  await client.tx(async t => {
    category = await deleteLevelsByCategory(user, surveyId, category, t)

    const levelsAndCategoryNew = await Promise.all(levelNamesNew.map(
      (levelName, index) => insertLevel(user, surveyId,
        Category.newLevel(category, { [CategoryLevel.keysProps.name]: levelName }, index), t
      )
    ))
    return Category.assocLevelsArray(R.map(R.prop('level'))(levelsAndCategoryNew))(category)
  })

const deleteItem = async (user, surveyId, categoryUuid, itemUuid, client = db) =>
  await client.tx(async t => {
    await Promise.all([
      CategoryRepository.deleteItem(surveyId, itemUuid, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryItemDelete, { itemUuid }, t),
    ])

    return await validateCategory(surveyId, categoryUuid, t)
  })

module.exports = {
  //CREATE
  insertCategory,
  insertLevel,
  insertItem,
  insertItems,
  createImportSummary: CategoryImportCSVParser.createImportSummary,
  createImportSummaryFromStream: CategoryImportCSVParser.createImportSummaryFromStream,

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
  deleteLevelsFromIndex,
  deleteItem,

  //UTILS
  replaceLevels,
  validateCategory,
}