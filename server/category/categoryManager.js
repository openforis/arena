const Promise = require('bluebird')
const R = require('ramda')
const db = require('../db/db')

const {publishSurveySchemaTableProps, markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')
const {toIndexedObj} = require('../../common/survey/surveyUtils')

const CategoryRepository = require('./categoryRepository')
const CategoryValidator = require('./categoryValidator')
const Category = require('../../common/survey/category')

const {logActivity} = require('../activityLog/activityLogger')

// ====== VALIDATION
const validateCategory = async (surveyId, categories, category, draft) => {
  const items = await CategoryRepository.fetchItemsByCategoryId(surveyId, category.id, draft)

  return await assocValidation(category, categories, items)
}

const assocValidation = async (category, categories = [], items = []) => ({
  ...category,
  validation: await CategoryValidator.validateCategory(categories, category, items)
})

// ====== CREATE

const insertCategory = async (user, surveyId, category) =>
  db.tx(async t => {
    const categoryDb = await CategoryRepository.insertCategory(surveyId, category, t)
    const levels = Category.getLevelsArray(category)

    //insert levels
    const levelsDb = await Promise.all(
      levels.map(async level =>
        await CategoryRepository.insertLevel(surveyId, categoryDb.id, level, t)
      )
    )
    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, 'insertCategory', category, t)

    return await assocValidation(Category.assocLevelsArray(levelsDb)(categoryDb))
  })

const insertLevel = async (user, surveyId, categoryId, level) =>
  db.tx(async t => {
    const levelDb = await CategoryRepository.insertLevel(surveyId, categoryId, level, t)

    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, 'insertCategoryLevel', {categoryId, level}, t)

    return levelDb
  })

const insertItem = async (user, surveyId, item) =>
  db.tx(async t => {
    const itemDb = await CategoryRepository.insertItem(surveyId, item, t)

    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, 'insertCategoryLevel', {item}, t)

    return itemDb
  })

// ====== READ
const fetchCategoriesAndLevels = async (surveyId, draft) => {
  const categoriesDb = await CategoryRepository.fetchCategoriesBySurveyId(surveyId, draft)

  return await Promise.all(
    categoriesDb.map(async category => ({
      ...category,
      levels: toIndexedObj(
        await CategoryRepository.fetchLevelsByCategoryId(surveyId, category.id, draft),
        'index'
      ),
    }))
  )
}

const fetchCategoryById = async (surveyId, categoryId, draft = false, validate = true) => {
  const categories = await fetchCategoriesAndLevels(surveyId, draft)
  const category = R.find(R.propEq('id', categoryId))(categories)

  return validate
    ? await validateCategory(surveyId, categories, category, draft)
    : category
}

const fetchCategoriesBySurveyId = async (surveyId, draft = false, validate = true) => {
  const categories = await fetchCategoriesAndLevels(surveyId, draft)

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

const updateCategoryProp = async (user, surveyId, categoryId, key, value) =>
  db.tx(async t => {
    const category = await CategoryRepository.updateCategoryProp(surveyId, categoryId, key, value, t)

    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, 'updateCategoryProp', {categoryId, key, value}, t)

    return category
  })

const updateLevelProp = async (user, surveyId, levelId, key, value) =>
  db.tx(async t => {
    const level = await CategoryRepository.updateLevelProp(surveyId, levelId, key, value, t)

    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, 'updateCategoryLevelProp', {levelId, key, value}, t)

    return level
  })

const updateItemProp = async (user, surveyId, itemId, key, value) =>
  db.tx(async t => {
    const item = await CategoryRepository.updateItemProp(surveyId, itemId, key, value, t)

    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, 'updateCategoryItemProp', {itemId, key, value}, t)

    return item
  })

// ====== DELETE
const deleteCategory = async (user, surveyId, categoryId) =>
  db.tx(async t => {
    await CategoryRepository.deleteCategory(surveyId, categoryId, t)
    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, 'deleteCategory', {categoryId}, t)
  })

const deleteLevel = async (user, surveyId, levelId) =>
  db.tx(async t => {
    await CategoryRepository.deleteLevel(surveyId, levelId, t)
    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, 'deleteCategoryLevel', {levelId}, t)
  })

const deleteItem = async (user, surveyId, itemId) =>
  db.tx(async t => {
    await CategoryRepository.deleteItem(surveyId, itemId, t)
    await markSurveyDraft(surveyId, t)

    await logActivity(user, surveyId, 'deleteCategoryItem', {itemId}, t)
  })

module.exports = {

  //VALIDATION
  validateCategory,

  //CREATE
  insertCategory,
  insertLevel,
  insertItem,

  //READ
  fetchCategoryById,
  fetchCategoriesBySurveyId,
  fetchItemsByCategoryId: CategoryRepository.fetchItemsByCategoryId,
  fetchItemsByParentUuid: CategoryRepository.fetchItemsByParentUuid,
  fetchItemByUuid: CategoryRepository.fetchItemByUuid,

  //UPDATE
  publishProps,
  updateCategoryProp,
  updateLevelProp,
  updateItemProp,

  //DELETE
  deleteCategory,
  deleteLevel,
  deleteItem,
}