import * as R from 'ramda'

import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import { StatusCodes } from '@core/systemError'
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
  const updatedCategory = await CategoryManager.updateCategoryProp({
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

  // Extra def names are validated against a lowercase-only pattern on update (unlike on create).
  const newName = 'extra_def_text_modified'
  const categoryUpdated = await CategoryManager.updateCategoryItemExtraDefItem({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
    name: 'extraDefText',
    itemExtraDef: { name: newName, dataType: ExtraPropDef.dataTypes.text },
  })

  // Renamed extra def replaces the old key; the other extra def (extraDefNumber) is preserved.
  expect(Category.getItemExtraDefKeys(categoryUpdated)).toEqual([newName, 'extraDefNumber'])
  expect(Category.getItemExtraDef(categoryUpdated)[newName].dataType).toBe(ExtraPropDef.dataTypes.text)
}

export const deleteCategoryItemExtraDefTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const extraDef = { extraDefText: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }) }
  const categoryReq = Category.assocItemExtraDef(extraDef)(
    Category.newCategory({ name: 'category_delete_extradef_test' })
  )
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })
  const categoryUuid = Category.getUuid(category)
  const level = Category.getLevelByIndex(0)(category)

  // an item with a value set for the extra prop is required to reach the delete branch in
  // CategoryManager._updateCategoryItemsExtraDef (items with no value for the prop are skipped);
  // deleting used to crash there because itemExtraDef is null (like the real API/webapp call) when deleted is true
  await CategoryManager.insertItem(
    user,
    surveyId,
    categoryUuid,
    CategoryItem.newItem(CategoryLevel.getUuid(level), null, {
      code: '001',
      labels: { en: 'Item 1' },
      extra: { extraDefText: 'some value' },
    })
  )

  const categoryUpdated = await CategoryManager.updateCategoryItemExtraDefItem({
    user,
    surveyId,
    categoryUuid,
    name: 'extraDefText',
    itemExtraDef: null,
    deleted: true,
  })

  expect(Category.getItemExtraDefKeys(categoryUpdated)).toEqual([])
}

export const convertCategoryToGeoPackageTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const categoryReq = Category.newCategory({ name: 'category_geopackage_test' })
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })

  const categoryUpdated = await CategoryManager.convertCategoryToGeoPackage({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
  })

  const locationDef = Category.getItemExtraDefsArray(categoryUpdated).find(
    (extraDef) => ExtraPropDef.getName(extraDef) === Category.locationItemExtraDefName
  )
  expect(locationDef).toBeDefined()
  expect(ExtraPropDef.getDataType(locationDef)).toBe(ExtraPropDef.dataTypes.geometryPoint)
  expect(ExtraPropDef.isLocked(locationDef)).toBe(true)

  // idempotent: converting again does not duplicate or reset the extra def
  const categoryUpdatedAgain = await CategoryManager.convertCategoryToGeoPackage({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
    locked: false,
  })
  expect(Category.getItemExtraDefsArray(categoryUpdatedAgain).length).toBe(1)
  expect(ExtraPropDef.isLocked(Category.getItemExtraDefsArray(categoryUpdatedAgain)[0])).toBe(true)
}

export const convertCategoryToGeoPackageFixesWrongTypeLocationExtraDefTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  // a pre-existing 'location' extra prop def of the wrong data type (e.g. imported from a CSV
  // where 'location' was just a text column) must not be mistaken for a real geometryPoint one:
  // Category.hasLocationExtraProp would stay false forever and the conversion would be a permanent no-op
  const categoryReq = Category.assocItemExtraDef({
    notes: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text, index: 0 }),
    [Category.locationItemExtraDefName]: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text, index: 1 }),
  })(Category.newCategory({ name: 'category_geopackage_wrong_type_location_test' }))
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })

  const categoryUpdated = await CategoryManager.convertCategoryToGeoPackage({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
  })

  const extraDefsArray = Category.getItemExtraDefsArray(categoryUpdated)
  // the wrong-type def is fixed in place, not duplicated alongside a second 'location' def
  expect(extraDefsArray.length).toBe(2)

  const locationDef = Category.getItemExtraDef(categoryUpdated)[Category.locationItemExtraDefName]
  expect(ExtraPropDef.getDataType(locationDef)).toBe(ExtraPropDef.dataTypes.geometryPoint)
  expect(ExtraPropDef.isLocked(locationDef)).toBe(true)
  // original index is preserved
  expect(ExtraPropDef.getIndex(locationDef)).toBe(1)

  expect(Category.hasLocationExtraProp(categoryUpdated)).toBe(true)
}

export const convertCategoryToSamplingPointDataTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const categoryReq = Category.newCategory({ name: 'category_spd_test' })
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })

  const categoryUpdated = await CategoryManager.convertCategoryToSamplingPointData({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
  })

  expect(Category.getName(categoryUpdated)).toBe(Category.samplingPointDataCategoryName)
  const locationDef = Category.getItemExtraDefsArray(categoryUpdated).find(
    (extraDef) => ExtraPropDef.getName(extraDef) === Category.locationItemExtraDefName
  )
  expect(locationDef).toBeDefined()
  expect(ExtraPropDef.isLocked(locationDef)).toBe(true)
}

export const convertCategoryToSamplingPointDataAlreadyConvertedTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  // Reuses the sampling_point_data category already created and converted by
  // convertCategoryToSamplingPointDataTest above: since sampling_point_data is a survey-wide
  // singleton, converting a *different* category here would incorrectly hit the duplicate check
  // instead of exercising the no-op-safe-rename path this test targets.
  const categories = await CategoryManager.fetchCategoriesBySurveyId({ surveyId, draft: true })
  const category = categories.find((c) => Category.getName(c) === Category.samplingPointDataCategoryName)
  expect(category).toBeDefined()

  // converting an already-sampling_point_data-named category again must be a no-op-safe rename,
  // not a rejection
  const categoryUpdatedAgain = await CategoryManager.convertCategoryToSamplingPointData({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
  })

  expect(Category.getName(categoryUpdatedAgain)).toBe(Category.samplingPointDataCategoryName)
  const locationDefs = Category.getItemExtraDefsArray(categoryUpdatedAgain).filter(
    (extraDef) => ExtraPropDef.getName(extraDef) === Category.locationItemExtraDefName
  )
  expect(locationDefs.length).toBe(1)
  expect(ExtraPropDef.isLocked(locationDefs[0])).toBe(true)
}

export const convertCategoryToSamplingPointDataDuplicateTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  // a sampling_point_data category already exists from convertCategoryToSamplingPointDataTest above
  const categoryReq = Category.newCategory({ name: 'category_spd_duplicate_test' })
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })

  const promise = CategoryManager.convertCategoryToSamplingPointData({
    user,
    surveyId,
    categoryUuid: Category.getUuid(category),
  })

  await expect(promise).rejects.toThrow()

  // the specific error key and a 400-class status code must be preserved:
  // the api route sends them back to the client with Response.sendErr
  const error = await promise.catch((err) => err)
  expect(error.key).toBe('validationErrors:category.samplingPointDataCategoryAlreadyExists')
  expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST)
}
