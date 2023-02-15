import { Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Record from '@core/record/record'

import * as JobManager from '@server/job/jobManager'
import * as Response from '@server/utils/response'
import * as CSVWriter from '@server/utils/file/csvWriter'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { ExportFileNameGenerator } from '@server/utils/exportFileNameGenerator'

import * as CategoryImportJobParams from './categoryImportJobParams'
import CategoryImportJob from './categoryImportJob'
import CategoriesExportJob from './CategoriesExportJob'
import * as CategoryManager from '../manager/categoryManager'
import { CategoryImportTemplateGenerator } from '../manager/categoryImportTemplateGenerator'
import { CategoryItemsSummaryBuilder } from './categoryItemsSummaryBuilder'
import { createSamplingPointDataRecordFinder } from './samplingPointDataRecordFinder'

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
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const fileName = ExportFileNameGenerator.generate({
    survey,
    fileType: 'Category',
    itemName: Category.getName(category),
  })
  Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

  await CategoryManager.exportCategoryToStream({ surveyId, categoryUuid, draft, outputStream: res })
}

export const exportCategoryImportTemplateGeneric = async ({ surveyId, draft, res }) => {
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const templateData = CategoryImportTemplateGenerator.generateTemplate({ survey })
  const fileName = ExportFileNameGenerator.generate({ survey, fileType: 'CategoryImportGeneric' })
  Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

  await CSVWriter.writeItemsToStream({ outputStream: res, items: templateData })
}

export const exportCategoryImportTemplate = async ({ surveyId, categoryUuid, draft, res }) => {
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const templateData = CategoryImportTemplateGenerator.generateTemplate({ survey, category })
  const fileName = ExportFileNameGenerator.generate({
    survey,
    fileType: 'CategoryImport',
    itemName: Category.getName(category),
  })
  Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

  await CSVWriter.writeItemsToStream({ outputStream: res, items: templateData })
}

export const exportCategoryImportTemplateSamplingPointData = async ({ surveyId, draft, res }) => {
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const templateData = CategoryImportTemplateGenerator.generateSamplingPointDataTemplate({ survey })
  const fileName = ExportFileNameGenerator.generate({ survey, fileType: 'SamplingPointDataImport' })
  Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

  await CSVWriter.writeItemsToStream({ outputStream: res, items: templateData })
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

const _getSamplingPointDataCategory = async ({ surveyId, draft = true }) => {
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
  const category = await _getSamplingPointDataCategory({ surveyId, draft })
  if (!category) return []

  const items = await CategoryManager.fetchItemsByLevelIndex({
    surveyId,
    categoryUuid: Category.getUuid(category),
    levelIndex,
    limit,
    offset,
    draft,
  })

  const recordFinder = await createSamplingPointDataRecordFinder({ surveyId, draft })

  const samplingPointData = items.map((item) => {
    const location = CategoryItem.getExtraProp('location')(item)
    const codes = CategoryItem.getCodesHierarchy(item)
    const point = Points.parse(location)
    const pointLatLong = Points.toLatLong(point)

    const record = recordFinder?.(item)

    return {
      uuid: CategoryItem.getUuid(item),
      codes,
      latLng: [pointLatLong.y, pointLatLong.x],
      location,
      ...(record ? { recordUuid: Record.getUuid(record) } : {}),
    }
  })
  return samplingPointData
}

export const fetchCategoryItemsSummary = async ({ surveyId, categoryUuid, language, draft = false }) => {
  const category = await fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const items = await fetchItemsByCategoryUuid({ surveyId, categoryUuid, draft })

  return CategoryItemsSummaryBuilder.toItemsSummary({ category, items, language })
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
  updateCategoryItemExtraDefItem,
  cleanupCategory,
  convertCategoryToReportingData,
  updateLevelProp,
  updateItemProp,

  deleteCategory,
  deleteLevel,
  deleteItem,
} = CategoryManager
