import { Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Record from '@core/record/record'

import * as JobManager from '@server/job/jobManager'
import * as Response from '@server/utils/response'
import * as CSVWriter from '@server/utils/file/csvWriter'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import { CategoryImportTemplateGenerator } from '@server/modules/category/manager/categoryImportTemplateGenerator'
import { ExportFileNameGenerator } from '@server/utils/exportFileNameGenerator'

import * as CategoryImportJobParams from './categoryImportJobParams'
import CategoryImportJob from './categoryImportJob'
import CategoriesExportJob from './CategoriesExportJob'
import { createSamplingPointDataRecordFinder } from './samplingPointDataRecordFinder'
import CategoriesBatchImportJob from './CategoriesBatchImportJob'

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

export const createBatchImportJob = ({ user, surveyId, filePath }) => {
  const job = new CategoriesBatchImportJob({ user, surveyId, filePath })
  JobManager.executeJobThread(job)
  return job
}

export const exportCategory = async ({
  surveyId,
  categoryUuid,
  draft,
  language = null,
  includeUuid = false,
  includeSingleCode = false,
  includeCodeJoint = false,
  includeLevelPosition = false,
  includeReportingDataCumulativeArea = false,
  res,
}) => {
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const fileName = ExportFileNameGenerator.generate({
    survey,
    fileType: 'Category',
    itemName: Category.getName(category),
  })
  Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

  await CategoryManager.exportCategoryToStream({
    survey,
    categoryUuid,
    draft,
    language,
    includeUuid,
    includeSingleCode,
    includeCodeJoint,
    includeLevelPosition,
    includeReportingDataCumulativeArea,
    outputStream: res,
  })
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

  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const surveyInfo = Survey.getSurveyInfo(survey)
  const srsIndex = Survey.getSRSIndex(surveyInfo)

  const samplingPointData = items.reduce((acc, item) => {
    const location = CategoryItem.getExtraProp('location')(item)
    if (!location) return acc

    const codes = CategoryItem.getCodesHierarchy(item)
    const point = Points.parse(location)
    const pointLatLong = Points.toLatLong(point, srsIndex)

    const record = recordFinder?.(item)

    acc.push({
      uuid: CategoryItem.getUuid(item),
      codes,
      latLng: [pointLatLong.y, pointLatLong.x],
      location,
      ...(record ? { recordUuid: Record.getUuid(record) } : {}),
    })
    return acc
  }, [])
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
  countItemsBySurveyId,
  countItemsByLevelIndex,
  fetchItemsByLevelIndex,
  fetchItemsCountIndexedByCategoryUuid,

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
