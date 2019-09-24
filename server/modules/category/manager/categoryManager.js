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

const assocLevels = (surveyId, draft, client) =>
  async category =>
    Category.assocLevelsArray(
      await CategoryRepository.fetchLevelsByCategoryUuid(surveyId, Category.getUuid(category), draft, client)
    )(category)

// ====== VALIDATION

const _validateCategoryFromCategories = async (surveyId, categories, categoryUuid, client = db) => {
  const category = R.prop(categoryUuid, categories)
  const items = await CategoryRepository.fetchItemsByCategoryUuid(surveyId, categoryUuid, true, client)
  const validation = await CategoryValidator.validateCategory(categories, category, items)
  await CategoryRepository.updateCategoryValidation(surveyId, categoryUuid, validation, client)
  return Validation.assocValidation(validation)(category)
}

const validateCategory = async (surveyId, categoryUuid, client = db) => {
  const categories = await CategoryRepository.fetchCategoriesAndLevelsBySurveyId(surveyId, true, true, client)
  return await _validateCategoryFromCategories(surveyId, categories, categoryUuid, client)
}

const validateCategories = async (surveyId, client = db) => {
  const categories = await CategoryRepository.fetchCategoriesAndLevelsBySurveyId(surveyId, true, true, client)

  const categoriesValidated = await Promise.all(Object.entries(categories).map(
    ([categoryUuid, category]) => _validateCategoryFromCategories(surveyId, categories, categoryUuid, client)
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

    return validateCategory(surveyId, Category.getUuid(categoryDb), t)
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
 *
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

// ====== READ
const _fetchCategoriesAndLevels = async (surveyId, draft, client = db) => {
  const categoriesDb = await CategoryRepository.fetchCategoriesBySurveyId(surveyId, draft, client)

  return await Promise.all(
    categoriesDb.map(assocLevels(surveyId, draft, client))
  )
}

const fetchCategoryByUuid = async (surveyId, categoryUuid, draft = false, validate = true, client = db) => {
  const categoryDb = await CategoryRepository.fetchCategoryByUuid(surveyId, categoryUuid, draft, client)
  return R.pipe(
    assocLevels(surveyId, draft, client),
    R.unless(
      R.always(validate),
      R.omit(Validation.keys.validation)
    )
  )(categoryDb)
}

const fetchCategoriesBySurveyId = async (surveyId, draft = false, validate = true, client = db) => {
  const categories = await _fetchCategoriesAndLevels(surveyId, draft, client)
  return validate
    ? categories
    : R.map(R.omit([Validation.keys.validation]))(categories)
}

// ====== UPDATE

const publishProps = async (surveyId, langsDeleted, client = db) => {
  await publishSurveySchemaTableProps(surveyId, 'category', client)

  await publishSurveySchemaTableProps(surveyId, 'category_level', client)

  await publishSurveySchemaTableProps(surveyId, 'category_item', client)

  for (const langDeleted of langsDeleted) {
    await CategoryRepository.deleteItemLabels(surveyId, langDeleted, client)
  }
}

const updateCategoryProp = async (user, surveyId, categoryUuid, key, value, client = db) =>
  await client.tx(async t => {
    await CategoryRepository.updateCategoryProp(surveyId, categoryUuid, key, value, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryPropUpdate, { categoryUuid, key, value }, t)

    const categories = await validateCategories(surveyId, t)
    return {
      categories,
      category: ObjectUtils.findByUuid(categoryUuid)(categories)
    }
  })

const updateLevelProp = async (user, surveyId, categoryUuid, levelUuid, key, value, client = db) =>
  await client.tx(async t => {
    const level = await CategoryRepository.updateLevelProp(surveyId, levelUuid, key, value, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelPropUpdate, { levelUuid, key, value }, t)

    const category = await validateCategory(surveyId, categoryUuid, t)

    return { category, level }
  })

const updateItemProp = async (user, surveyId, categoryUuid, itemUuid, key, value, client = db) =>
  await client.tx(async t => {
    const item = await CategoryRepository.updateItemProp(surveyId, itemUuid, key, value, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryItemPropUpdate, { itemUuid, key, value }, t)

    const category = await validateCategory(surveyId, categoryUuid, t)

    return { category, item }
  })

// ====== DELETE
const deleteCategory = async (user, surveyId, categoryUuid, client = db) =>
  await client.tx(async t => {
    await CategoryRepository.deleteCategory(surveyId, categoryUuid, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryDelete, { categoryUuid }, t)

    return validateCategories(surveyId, t)
  })

const deleteLevel = async (user, surveyId, categoryUuid, levelUuid, client = db) =>
  await client.tx(async t => {
    await CategoryRepository.deleteLevel(surveyId, levelUuid, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelDelete, { levelUuid }, t)

    return await validateCategory(surveyId, categoryUuid, t)
  })

const deleteLevelsByCategory = async (user, surveyId, categoryUuid, client = db) =>
  await client.tx(async t => {
    await CategoryRepository.deleteLevelsByCategory(surveyId, categoryUuid, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelsDelete, { categoryUuid }, t)

    return validateCategory(surveyId, categoryUuid, t)
  })

const deleteLevelsFromIndex = async (user, surveyId, category, fromIndex, client = db) =>
  await client.tx(async t => {
    let levels = Category.getLevelsArray(category)
    let lastLevelIndex = levels.length - 1

    while (lastLevelIndex > fromIndex) {
      const level = levels.pop()
      const levelUuid = CategoryLevel.getUuid(level)
      await CategoryRepository.deleteLevel(surveyId, levelUuid, t)

      await markSurveyDraft(surveyId, t)

      await ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelDelete, { levelUuid }, t)

      lastLevelIndex--
    }
    return await validateCategory(surveyId, Category.getUuid(category), t)
  })

/**
 * Deletes all levels and creates new ones with the specified names
 */
const replaceLevels = async (user, surveyId, categoryUuid, levelNamesNew, client = db) =>
  await client.tx(async t => {
    let category = await deleteLevelsByCategory(user, surveyId, categoryUuid, t)

    for (const levelName of levelNamesNew) {
      const levelToInsert = Category.newLevel(category, {
        [CategoryLevel.props.name]: levelName
      })
      const { level } = await insertLevel(user, surveyId, levelToInsert, t)
      category = Category.assocLevel(level)(category)
    }
    return await validateCategory(surveyId, categoryUuid, t)
  })

const deleteItem = async (user, surveyId, categoryUuid, itemUuid, client = db) =>
  await client.tx(async t => {
    await CategoryRepository.deleteItem(surveyId, itemUuid, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryItemDelete, { itemUuid }, t)

    return validateCategory(surveyId, categoryUuid, t)
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
  fetchCategoryByUuid,
  fetchCategoriesBySurveyId,
  fetchCategoriesAndLevelsBySurveyId: CategoryRepository.fetchCategoriesAndLevelsBySurveyId,
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
  deleteLevelsByCategory,
  deleteLevelsFromIndex,
  deleteItem,

  //UTILS
  replaceLevels,
}