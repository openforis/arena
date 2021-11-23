import { Point, Points, SRSs } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'

import * as JobManager from '@server/job/jobManager'
import * as Response from '@server/utils/response'

import * as CategoryImportJobParams from './categoryImportJobParams'
import CategoryImportJob from './categoryImportJob'
import CategoriesExportJob from './CategoriesExportJob'
import * as CategoryManager from '../manager/categoryManager'

export const importCategory = (user, surveyId, categoryUuid, summary) => {
  const job = new CategoryImportJob({
    user,
    surveyId,
    [CategoryImportJobParams.keys.categoryUuid]: categoryUuid,
    [CategoryImportJobParams.keys.summary]: summary,
  })

  JobManager.executeJobThread(job)

  return job
}

export const exportCategory = async ({ surveyId, categoryUuid, draft, res }) => {
  const numberOfItemsInCategory = await CategoryManager.countItemsByCategoryUuid(surveyId, categoryUuid)
  const categoryIsEmpty = numberOfItemsInCategory <= 0

  let fileName
  if (categoryIsEmpty) {
    fileName = 'template_category_hierarchical.csv'
  } else {
    const category = await CategoryManager.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
    fileName = `${Category.getName(category) || 'category'}.csv`
  }
  Response.setContentTypeFile(res, fileName, null, Response.contentTypes.csv)

  if (categoryIsEmpty) {
    // template
    await CategoryManager.writeCategoryExportTemplateToStream({ outputStream: res })
  } else {
    await CategoryManager.exportCategoryToStream({ surveyId, categoryUuid, draft, outputStream: res })
  }
}

export const exportAllCategories = ({ user, surveyId, draft }) => {
  const job = new CategoriesExportJob({
    user,
    surveyId,
    draft,
  })

  JobManager.executeJobThread(job)

  return job
}

const _getSamplingPointDataCategory = async ({ surveyId }) => {
  const draft = true
  const categories = await CategoryManager.fetchCategoriesBySurveyId({ surveyId, draft })
  return categories.find((category) => Category.getName(category) === Survey.samplingPointDataCategoryName)
}

export const countSamplingPointData = async ({ surveyId, levelIndex = 0 }) => {
  const category = await _getSamplingPointDataCategory({ surveyId })
  const categoryUuid = Category.getUuid(category)
  const count = await CategoryManager.countItemsByLevelIndex({ surveyId, categoryUuid, levelIndex })
  return count
}

export const fetchSamplingPointData = async ({ surveyId, levelIndex = 0, limit, offset }) => {
  const draft = true
  const category = await _getSamplingPointDataCategory({ surveyId })
  const items = await CategoryManager.fetchItemsByLevelIndex({
    surveyId,
    categoryUuid: Category.getUuid(category),
    levelIndex,
    limit,
    offset,
    draft,
  })
  const samplingPointData = items.map((item) => {
    const location = CategoryItem.getExtraProp('location')(item)
    const ancestorCodes = CategoryItem.getAncestorCodes(item)
    const point = Points.parse(location)
    // TODO convert it to lat long
    const pointLatLong = point
    return { codes: [...ancestorCodes, CategoryItem.getCode(item)], location: [pointLatLong.y, pointLatLong.x] }
  })
  return samplingPointData
}

export const {
  insertCategory,
  createImportSummary,
  createImportSummaryFromStream,
  insertLevel,
  insertItem,
  insertItems,

  insertItemsInBatch,

  countCategories,
  fetchCategoriesBySurveyId,
  fetchCategoriesAndLevelsBySurveyId,
  fetchCategoryAndLevelsByUuid,
  fetchItemsByParentUuid,
  fetchItemsByCategoryUuid,
  countItemsByLevelIndex,
  fetchItemsByLevelIndex,

  updateCategoryProp,
  cleanupCategory,
  updateLevelProp,
  updateItemProp,

  deleteCategory,
  deleteLevel,
  deleteItem,
} = CategoryManager
