import * as R from 'ramda'

import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import { getContextSurveyId, getContextUser } from '../../config/context'

export const createCategoryTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const extraDef = {
    extraDefText: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }),
    extraDefNumber: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.number }),
  }
  const categoryReq = Category.assocItemExtraDef(extraDef)(Category.newCategory({ name: 'category_test' }))
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })

  /* eslint-disable no-unused-expressions */
  expect(Category.getUuid(category)).toBeDefined()

  const reloadedCategory = await CategoryManager.fetchCategoryAndLevelsByUuid({
    surveyId,
    categoryUuid: Category.getUuid(category),
    draft: true,
    includeValidation: true,
  })

  expect(reloadedCategory).toEqual(category)
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
  const { level } = await CategoryManager.insertLevel({ user, surveyId, level: levelReq })

  expect(CategoryLevel.getName(level)).toBe(CategoryLevel.getName(levelReq))

  // Inserted level should be the 2nd
  expect(level.index).toBe(1)

  const reloadedCategory = await CategoryManager.fetchCategoryAndLevelsByUuid({
    surveyId,
    categoryUuid: Category.getUuid(category),
    draft: true,
    includeValidation: false,
  })

  // Levels must be 2
  expect(Category.getLevelsArray(reloadedCategory).length).toBe(2)
}

export const createCategoryItemTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const category = await _fetchFirstCategory(surveyId)

  const level = Category.getLevelByIndex(0)(category)

  const itemCode = '1'
  const itemLabel = 'Value 1'
  const extra = { extraDefText: 'extra 1', extraDefNumber: 3 }

  const itemReq = CategoryItem.newItem(CategoryLevel.getUuid(level), null, {
    code: itemCode,
    labels: { en: itemLabel },
    extra,
  })

  const { item } = await CategoryManager.insertItem(user, surveyId, Category.getUuid(category), itemReq)

  expect(CategoryItem.getCode(item)).toBe(itemCode)
  expect(CategoryItem.getLabel('en')(item)).toBe(itemLabel)
  expect(CategoryItem.getExtra(item)).toEqual(extra)
}

export const updateCategoryTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const category = await _fetchFirstCategory(surveyId)

  const newName = 'category_modified'
  const { category: updatedCategory } = await CategoryManager.updateCategoryProp({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
    key: 'name',
    value: newName,
  })

  expect(Category.getName(updatedCategory)).toBe(newName)
}

export const updateCategoryItemExtraDefTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const category = await _fetchFirstCategory(surveyId)

  const categoryUpdated = await CategoryManager.updateCategoryItemExtraDefItem({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
    name: 'extraDefText',
    value: { name: 'extraDefText_modified', dataType: ExtraPropDef.dataTypes.text },
  })

  const itemExtraDefExpected = { extraDefText_modified: { dataType: ExtraPropDef.dataTypes.text } }

  expect(Category.getItemExtraDef(categoryUpdated)).toBe(itemExtraDefExpected)
}
