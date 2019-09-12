const R = require('ramda')

const db = require('../../../db/db')

const { publishSurveySchemaTableProps, markSurveyDraft } = require('../../survey/repository/surveySchemaRepositoryUtils')
const { toIndexedObj } = require('../../../../common/survey/surveyUtils')

const CategoryRepository = require('../repository/categoryRepository')
const CategoryValidator = require('../categoryValidator')
const Category = require('../../../../common/survey/category')
const CategoryLevel = require('../../../../common/survey/categoryLevel')

const ActivityLog = require('../../activityLog/activityLogger')

// ====== VALIDATION
const validateCategory = async (surveyId, categories, category, draft, client = db) => {
  const items = await CategoryRepository.fetchItemsByCategoryUuid(surveyId, Category.getUuid(category), draft, client)
  return await assocValidation(category, categories, items)
}

const assocValidation = async (category, categories = [], items = []) => ({
  ...category,
  validation: await CategoryValidator.validateCategory(categories, category, items)
})

// ====== CREATE

const insertCategory = async (user, surveyId, category, client = db) =>
  await client.tx(async t => {
    const categoryDb = await CategoryRepository.insertCategory(surveyId, category, t)
    const levels = Category.getLevelsArray(category)

    //insert levels
    const levelsDb = await Promise.all(
      levels.map(async level =>
        await CategoryRepository.insertLevel(surveyId, level, t)
      )
    )
    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryInsert, category, t)

    return await assocValidation(Category.assocLevelsArray(levelsDb)(categoryDb))
  })

const insertLevel = async (user, surveyId, level, client = db) =>
  (await client.tx(t => Promise.all([
      CategoryRepository.insertLevel(surveyId, level, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelInsert, { level }, t)
    ])
  ))[0]

const insertItem = async (user, surveyId, item, client = db) =>
  await client.tx(async t => {
    const itemDb = await CategoryRepository.insertItem(surveyId, item, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryItemInsert, item, t)

    return itemDb
  })

const insertItems = async (user, surveyId, items, client = db) =>
  await client.tx(async t => {
    await CategoryRepository.insertItems(surveyId, items, client)

    await markSurveyDraft(surveyId, t)

    const activities = items.map(item => ({
        type: ActivityLog.type.categoryItemInsert,
        params: item
      })
    )
    await ActivityLog.logMany(user, surveyId, activities, client)
  })

// ====== READ
const fetchCategoriesAndLevels = async (surveyId, draft, client = db) => {
  const categoriesDb = await CategoryRepository.fetchCategoriesBySurveyId(surveyId, draft, client)

  return await Promise.all(
    categoriesDb.map(async category => ({
      ...category,
      levels: toIndexedObj(
        await CategoryRepository.fetchLevelsByCategoryUuid(surveyId, Category.getUuid(category), draft, client),
        'index'
      ),
    }))
  )
}

const fetchCategoryByUuid = async (surveyId, categoryUuid, draft = false, validate = true, client = db) => {
  const categories = await fetchCategoriesAndLevels(surveyId, draft, client)
  const category = R.find(R.propEq('uuid', categoryUuid))(categories)

  return validate
    ? await validateCategory(surveyId, categories, category, draft, client)
    : category
}

const fetchCategoriesBySurveyId = async (surveyId, draft = false, validate = true, client = db) => {
  const categories = await fetchCategoriesAndLevels(surveyId, draft, client)

  return validate
    ? await Promise.all(
      categories.map(category => validateCategory(surveyId, categories, category, draft, client)
      )
    )
    : categories
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
    const category = await CategoryRepository.updateCategoryProp(surveyId, categoryUuid, key, value, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryPropUpdate, { categoryUuid, key, value }, t)

    return category
  })

const updateLevelProp = async (user, surveyId, levelUuid, key, value, client = db) =>
  await client.tx(async t => {
    const level = await CategoryRepository.updateLevelProp(surveyId, levelUuid, key, value, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelPropUpdate, { levelUuid, key, value }, t)

    return level
  })

const updateItemProp = async (user, surveyId, itemUuid, key, value, client = db) =>
  await client.tx(async t => {
    const item = await CategoryRepository.updateItemProp(surveyId, itemUuid, key, value, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryItemPropUpdate, { itemUuid, key, value }, t)

    return item
  })

// ====== DELETE
const deleteCategory = async (user, surveyId, categoryUuid, client = db) =>
  await client.tx(t => Promise.all([
      CategoryRepository.deleteCategory(surveyId, categoryUuid, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryDelete, { categoryUuid }, t)
    ])
  )

const deleteLevel = async (user, surveyId, levelUuid, client = db) =>
  await client.tx(t => Promise.all([
      CategoryRepository.deleteLevel(surveyId, levelUuid, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelDelete, { levelUuid }, t)
    ])
  )

const deleteLevelsByCategory = async (user, surveyId, categoryUuid, client = db) => {
  await client.tx(t => Promise.all([
      CategoryRepository.deleteLevelsByCategory(surveyId, categoryUuid, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelsDelete, { categoryUuid }, t)
    ])
  )
  return await fetchCategoryByUuid(surveyId, categoryUuid, true, false, client)
}

const deleteLevelsFromIndex = async (user, surveyId, category, fromIndex, tx) => {
  let levels = Category.getLevelsArray(category)
  let lastLevelIndex = levels.length - 1

  while (lastLevelIndex > fromIndex) {
    const level = levels.pop()
    await deleteLevel(user, surveyId, CategoryLevel.getUuid(level), tx)
    category = Category.assocLevelsArray(levels)(category)
    lastLevelIndex--
  }
  return category
}

/**
 * Deletes all levels and creates new ones with the specified names
 */
const replaceLevels = async (user, surveyId, categoryUuid, levelNamesNew, client = db) => {
  let category = await deleteLevelsByCategory(user, surveyId, categoryUuid, client)

  for (const levelName of levelNamesNew) {
    const levelToInsert = Category.newLevel(category, {
      [CategoryLevel.props.name]: levelName
    })
    const level = await insertLevel(user, surveyId, levelToInsert, client)
    category = Category.assocLevel(level)(category)
  }
  return category
}

const deleteItem = async (user, surveyId, itemUuid, client = db) =>
  await client.tx(t => Promise.all([
      CategoryRepository.deleteItem(surveyId, itemUuid, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.categoryItemDelete, { itemUuid }, t)
    ])
  )

module.exports = {

  //VALIDATION
  validateCategory,

  //CREATE
  insertCategory,
  insertLevel,
  insertItem,
  insertItems,

  //READ
  fetchCategoryByUuid,
  fetchCategoriesBySurveyId,
  fetchItemsByCategoryUuid: CategoryRepository.fetchItemsByCategoryUuid,
  fetchItemsByParentUuid: CategoryRepository.fetchItemsByParentUuid,
  fetchItemByUuid: CategoryRepository.fetchItemByUuid,
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