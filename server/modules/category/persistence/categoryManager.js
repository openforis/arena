const Promise = require('bluebird')
const R = require('ramda')

const db = require('../../../db/db')

const {publishSurveySchemaTableProps, markSurveyDraft} = require('../../survey/persistence/surveySchemaRepositoryUtils')
const {toIndexedObj} = require('../../../../common/survey/surveyUtils')

const CategoryRepository = require('./categoryRepository')
const CategoryValidator = require('../categoryValidator')
const Category = require('../../../../common/survey/category')

const ActivityLog = require('../../activityLog/activityLogger')

// ====== VALIDATION
const validateCategory = async (surveyId, categories, category, draft) => {
  const items = await CategoryRepository.fetchItemsByCategoryUuid(surveyId, category.uuid, draft)

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
        await CategoryRepository.insertLevel(surveyId, categoryDb.uuid, level, t)
      )
    )
    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryInsert, category, t)

    return await assocValidation(Category.assocLevelsArray(levelsDb)(categoryDb))
  })

const insertLevel = async (user, surveyId, categoryUuid, level, client = db) =>
  await client.tx(async t => {
    const levelDb = await CategoryRepository.insertLevel(surveyId, categoryUuid, level, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelInsert, {categoryUuid, level}, t)

    return levelDb
  })

const insertItem = async (user, surveyId, item, client = db) =>
  await client.tx(async t => {
    const itemDb = await CategoryRepository.insertItem(surveyId, item, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryItemInsert, item, t)

    return itemDb
  })

// ====== READ
const fetchCategoriesAndLevels = async (surveyId, draft, client = db) => {
  const categoriesDb = await CategoryRepository.fetchCategoriesBySurveyId(surveyId, draft, client)

  return await Promise.all(
    categoriesDb.map(async category => ({
      ...category,
      levels: toIndexedObj(
        await CategoryRepository.fetchLevelsByCategoryUuid(surveyId, category.uuid, draft, client),
        'index'
      ),
    }))
  )
}

const fetchCategoryByUuid = async (surveyId, categoryUuid, draft = false, validate = true) => {
  const categories = await fetchCategoriesAndLevels(surveyId, draft)
  const category = R.find(R.propEq('uuid', categoryUuid))(categories)

  return validate
    ? await validateCategory(surveyId, categories, category, draft)
    : category
}

const fetchCategoriesBySurveyId = async (surveyId, draft = false, validate = true, client = db) => {
  const categories = await fetchCategoriesAndLevels(surveyId, draft, client)

  return validate
    ? await Promise.all(
      categories.map(async category =>
        await validateCategory(surveyId, categories, category, draft)
      )
    )
    : categories
}

// ====== UPDATE

const publishProps = async (surveyId, client = db) => {
  await publishSurveySchemaTableProps(surveyId, 'category', client)

  await publishSurveySchemaTableProps(surveyId, 'category_level', client)

  await publishSurveySchemaTableProps(surveyId, 'category_item', client)
}

const updateCategoryProp = async (user, surveyId, categoryUuid, key, value, client = db) =>
  await client.tx(async t => {
    const category = await CategoryRepository.updateCategoryProp(surveyId, categoryUuid, key, value, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryPropUpdate, {categoryUuid, key, value}, t)

    return category
  })

const updateLevelProp = async (user, surveyId, levelUuid, key, value, client = db) =>
  await client.tx(async t => {
    const level = await CategoryRepository.updateLevelProp(surveyId, levelUuid, key, value, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelPropUpdate, {levelUuid, key, value}, t)

    return level
  })

const updateItemProp = async (user, surveyId, itemUuid, key, value, client = db) =>
  await client.tx(async t => {
    const item = await CategoryRepository.updateItemProp(surveyId, itemUuid, key, value, t)

    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryItemPropUpdate, {itemUuid, key, value}, t)

    return item
  })

// ====== DELETE
const deleteCategory = async (user, surveyId, categoryUuid) =>
  await db.tx(async t => {
    await CategoryRepository.deleteCategory(surveyId, categoryUuid, t)
    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryDelete, {categoryUuid}, t)
  })

const deleteLevel = async (user, surveyId, levelUuid) =>
  await db.tx(async t => {
    await CategoryRepository.deleteLevel(surveyId, levelUuid, t)
    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryLevelDelete, {levelUuid}, t)
  })

const deleteItem = async (user, surveyId, itemUuid) =>
  await db.tx(async t => {
    await CategoryRepository.deleteItem(surveyId, itemUuid, t)
    await markSurveyDraft(surveyId, t)

    await ActivityLog.log(user, surveyId, ActivityLog.type.categoryItemDelete, {itemUuid}, t)
  })

module.exports = {

  //VALIDATION
  validateCategory,

  //CREATE
  insertCategory,
  insertLevel,
  insertItem,
  insertItems: CategoryRepository.insertItems,

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
  deleteItem,
  deleteItemLabels: CategoryRepository.deleteItemLabels
}