const {getContextSurveyId} = require('./../../testContext')
const {expect} = require('chai')

const CategoryManager = require('../../../server/category/categoryManager')
const CategoryTest = require('../../../common/survey/category')

const createCategoryTest = async () => {
  const surveyId = getContextSurveyId()

  const categoryReq = CategoryTest.newCategory({name: 'category_test'})
console.log("=== surveyId ", surveyId)
console.log("=== categoryReq ", categoryReq)
  const category = await CategoryManager.insertCategory(surveyId, categoryReq)

  expect(category.uuid).to.exist

  const reloadedCategory = await CategoryManager.fetchCategoryByUuid(surveyId, category.uuid, true, true)

  expect(reloadedCategory).to.deep.equal(category)
}

const createCategoryLevelTest = async () => {
  const surveyId = getContextSurveyId()

  const category = (await CategoryManager.fetchCategoriesBySurveyId(surveyId, true, false))[0]

  const levelReq = CategoryTest.newLevel(category)
  const level = await CategoryManager.insertLevel(surveyId, category.uuid, levelReq)

  expect(CategoryTest.getLevelName(level)).to.be.equal(CategoryTest.getLevelName(levelReq))

  //inserted level should be the 2nd
  expect(level.index).to.be.equal(1)

  const reloadedCategory = await CategoryManager.fetchCategoryByUuid(surveyId, category.uuid, true, false)

  //levels must be 2
  expect(CategoryTest.getLevelsArray(reloadedCategory).length).to.be.equal(2)
}

const createCategoryItemTest = async () => {
  const surveyId = getContextSurveyId()

  const category = (await CategoryManager.fetchCategoriesBySurveyId(surveyId, true, false))[0]

  const level = CategoryTest.getLevelByIndex(0)(category)

  const itemCode = '1'
  const itemLabel = 'Value 1'

  const itemReq = CategoryTest.newItem(level.uuid, null, {code: itemCode, labels: {en: itemLabel}})

  const item = await CategoryManager.insertItem(surveyId, itemReq)

  expect(CategoryTest.getItemCode(item)).to.be.equal(itemCode)
  expect(CategoryTest.getItemLabel('en')(item)).to.be.equal(itemLabel)
}

const updateCategoryTest = async () => {
  const surveyId = getContextSurveyId()

  const category = (await CategoryManager.fetchCategoriesBySurveyId(surveyId, true, false))[0]

  const newName = 'category_modified'
  const updatedCategory = await CategoryManager.updateCategoryProp(surveyId, category.uuid, 'name', newName)

  expect(CategoryTest.getName(updatedCategory)).to.be.equal(newName)
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