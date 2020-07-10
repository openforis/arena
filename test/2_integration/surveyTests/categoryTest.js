import * as R from 'ramda'

import { expect } from 'chai'

import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import { getContextSurveyId, getContextUser } from '../../testContext'

export const createCategoryTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const categoryReq = Category.newCategory({ name: 'category_test' })
  const category = await CategoryManager.insertCategory(user, surveyId, categoryReq)

  /* eslint-disable no-unused-expressions */
  expect(Category.getUuid(category)).to.exist

  const reloadedCategory = await CategoryManager.fetchCategoryAndLevelsByUuid(
    surveyId,
    Category.getUuid(category),
    true,
    true
  )

  expect(reloadedCategory).to.deep.equal(category)
}

const _fetchFirstCategory = async (surveyId) => {
  const categories = await CategoryManager.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft: true })
  return R.pipe(R.values, R.head)(categories)
}

export const createCategoryLevelTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const category = await _fetchFirstCategory(surveyId)

  const levelReq = Category.newLevel(category)
  const { level } = await CategoryManager.insertLevel(user, surveyId, levelReq)

  expect(CategoryLevel.getName(level)).to.be.equal(CategoryLevel.getName(levelReq))

  // Inserted level should be the 2nd
  expect(level.index).to.be.equal(1)

  const reloadedCategory = await CategoryManager.fetchCategoryAndLevelsByUuid(
    surveyId,
    Category.getUuid(category),
    true,
    false
  )

  // Levels must be 2
  expect(Category.getLevelsArray(reloadedCategory).length).to.be.equal(2)
}

export const createCategoryItemTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const category = await _fetchFirstCategory(surveyId)

  const level = Category.getLevelByIndex(0)(category)

  const itemCode = '1'
  const itemLabel = 'Value 1'

  const itemReq = CategoryItem.newItem(CategoryLevel.getUuid(level), null, {
    code: itemCode,
    labels: { en: itemLabel },
  })

  const { item } = await CategoryManager.insertItem(user, surveyId, Category.getUuid(category), itemReq)

  expect(CategoryItem.getCode(item)).to.be.equal(itemCode)
  expect(CategoryItem.getLabel('en')(item)).to.be.equal(itemLabel)
}

export const updateCategoryTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const category = await _fetchFirstCategory(surveyId)

  const newName = 'category_modified'
  const { category: updatedCategory } = await CategoryManager.updateCategoryProp(
    user,
    surveyId,
    Category.getUuid(category),
    'name',
    newName
  )

  expect(Category.getName(updatedCategory)).to.be.equal(newName)
}
