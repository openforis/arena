const R = require('ramda')

const { getContextSurveyId, getContextUser } = require('../../testContext')
const { expect } = require('chai')

const CategoryManager = require('../../../server/modules/category/manager/categoryManager')
const Category = require('../../../core/survey/category')
const CategoryLevel = require('../../../core/survey/categoryLevel')
const CategoryItem = require('../../../core/survey/categoryItem')

const createCategoryTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const categoryReq = Category.newCategory({ name: 'category_test' })
  const category = await CategoryManager.insertCategory(user, surveyId, categoryReq)

  expect(Category.getUuid(category)).to.exist

  const reloadedCategory = await CategoryManager.fetchCategoryAndLevelsByUuid(surveyId, Category.getUuid(category), true, true)

  expect(reloadedCategory).to.deep.equal(category)
}

const createCategoryLevelTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const category = await _fetchFirstCategory(surveyId)

  const levelReq = Category.newLevel(category)
  const { level } = await CategoryManager.insertLevel(user, surveyId, levelReq)

  expect(CategoryLevel.getName(level)).to.be.equal(CategoryLevel.getName(levelReq))

  //inserted level should be the 2nd
  expect(level.index).to.be.equal(1)

  const reloadedCategory = await CategoryManager.fetchCategoryAndLevelsByUuid(surveyId, Category.getUuid(category), true, false)

  //levels must be 2
  expect(Category.getLevelsArray(reloadedCategory).length).to.be.equal(2)
}

const createCategoryItemTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const category = await _fetchFirstCategory(surveyId)

  const level = Category.getLevelByIndex(0)(category)

  const itemCode = '1'
  const itemLabel = 'Value 1'

  const itemReq = CategoryItem.newItem(CategoryLevel.getUuid(level), null, {
    code: itemCode,
    labels: { en: itemLabel }
  })

  const { item } = await CategoryManager.insertItem(user, surveyId, Category.getUuid(category), itemReq)

  expect(CategoryItem.getCode(item)).to.be.equal(itemCode)
  expect(CategoryItem.getLabel('en')(item)).to.be.equal(itemLabel)
}

const updateCategoryTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const category = await _fetchFirstCategory(surveyId)

  const newName = 'category_modified'
  const { category: updatedCategory } = await CategoryManager.updateCategoryProp(user, surveyId, Category.getUuid(category), 'name', newName)

  expect(Category.getName(updatedCategory)).to.be.equal(newName)
}

const _fetchFirstCategory = async surveyId => {
  const categories = await CategoryManager.fetchCategoriesAndLevelsBySurveyId(surveyId, true, false)
  return R.pipe(R.values, R.head)(categories)
}

module.exports = {
  //category
  createCategoryTest,
  updateCategoryTest,

  //level
  createCategoryLevelTest,

  //item
  createCategoryItemTest,
}