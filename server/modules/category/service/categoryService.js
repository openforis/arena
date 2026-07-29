import { Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Record from '@core/record/record'
import * as User from '@core/user/user'
import { FileFormats } from '@core/fileFormats'
import * as NumberUtils from '@core/numberUtils'
import * as Authorizer from '@core/auth/authorizer'

import * as JobManager from '@server/job/jobManager'
import * as Response from '@server/utils/response'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import UnauthorizedError from '@server/utils/unauthorizedError'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import { CategoryImportTemplateGenerator } from '@server/modules/category/manager/categoryImportTemplateGenerator'
import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

import * as CategoryImportJobParams from './categoryImportJobParams'
import CategoryImportJob from './categoryImportJob'
import CategoriesExportJob from './CategoriesExportJob'
import { createSamplingPointDataRecordFinder } from './samplingPointDataRecordFinder'
import CategoriesBatchImportJob from './CategoriesBatchImportJob'

export const importCategory = ({ user, surveyId, categoryUuid, summary }) => {
  const job = new CategoryImportJob({
    user,
    surveyId,
    [CategoryImportJobParams.keys.categoryUuid]: categoryUuid,
    [CategoryImportJobParams.keys.summary]: summary,
  })

  JobManager.enqueueJob(job)

  return job
}

export const createBatchImportJob = ({ user, surveyId, filePath }) => {
  const job = new CategoriesBatchImportJob({ user, surveyId, filePath })
  JobManager.enqueueJob(job)
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
  fileFormat = FileFormats.csv,
}) => {
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const fileName = ExportFileNameGenerator.generate({
    survey,
    fileType: 'Category',
    fileFormat,
    itemName: Category.getName(category),
  })
  Response.setContentTypeFile({ res, fileName, fileFormat })

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
    fileFormat,
  })
}

export const exportCategoryImportTemplateGeneric = async ({ surveyId, draft, res, fileFormat }) => {
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const templateData = CategoryImportTemplateGenerator.generateTemplate({ survey })
  const fileName = ExportFileNameGenerator.generate({ survey, fileType: 'CategoryImportGeneric', fileFormat })
  Response.setContentTypeFile({ res, fileName, fileFormat })
  await FlatDataWriter.writeItemsToStream({ outputStream: res, fileFormat, items: templateData })
}

export const exportCategoryImportTemplate = async ({ surveyId, categoryUuid, draft, res, fileFormat }) => {
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const templateData = CategoryImportTemplateGenerator.generateTemplate({ survey, category })
  const categoryName = Category.getName(category)
  const fileName = ExportFileNameGenerator.generate({
    survey,
    fileType: 'CategoryImport',
    itemName: categoryName,
    fileFormat,
  })
  Response.setContentTypeFile({ res, fileName, fileFormat })
  await FlatDataWriter.writeItemsToStream({ outputStream: res, fileFormat, items: templateData })
}

export const exportCategoryImportTemplateSamplingPointData = async ({ surveyId, draft, res, fileFormat }) => {
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const templateData = CategoryImportTemplateGenerator.generateSamplingPointDataTemplate({ survey })
  const fileName = ExportFileNameGenerator.generate({ survey, fileType: 'SamplingPointDataImport', fileFormat })
  Response.setContentTypeFile({ res, fileName, fileFormat })
  await FlatDataWriter.writeItemsToStream({ outputStream: res, fileFormat, items: templateData })
}

export const exportAllCategories = ({ user, surveyId, fileFormat, draft }) => {
  const job = new CategoriesExportJob({
    user,
    surveyId,
    fileFormat,
    draft,
  })

  JobManager.enqueueJob(job)

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

/**
 * Validates that the given value is a positive integer survey id.
 * @param {!object} params - Parameters object.
 * @param {number|string} params.surveyId - The value to validate.
 * @param {!string} params.paramName - The name of the parameter, used in the error message.
 * @returns {number} The survey id, converted to a number.
 * @throws {Error} If the value is not a positive integer.
 */
const _validateSurveyId = ({ surveyId, paramName }) => {
  if (!NumberUtils.isInteger(surveyId) || Number(surveyId) <= 0) {
    throw new Error(`${paramName} must be a positive integer`)
  }
  return Number(surveyId)
}

/**
 * Clones a category from another survey into the given survey, after validating the survey ids
 * and checking that the user is allowed to view the source survey.
 * @param {!object} params - Parameters object.
 * @param {!object} params.user - The user performing this operation.
 * @param {!number} params.sourceSurveyId - The id of the survey the category is cloned from.
 * @param {!string} params.sourceCategoryUuid - The uuid of the category to clone.
 * @param {!number} params.targetSurveyId - The id of the survey the category is cloned into.
 * @returns {Promise<Category>} The cloned and validated category.
 * @throws {UnauthorizedError} If the user is not allowed to view the source survey.
 */
export const cloneCategoryFromSurvey = async ({ user, sourceSurveyId, sourceCategoryUuid, targetSurveyId }) => {
  const sourceSurveyIdValidated = _validateSurveyId({ surveyId: sourceSurveyId, paramName: 'sourceSurveyId' })
  const targetSurveyIdValidated = _validateSurveyId({ surveyId: targetSurveyId, paramName: 'targetSurveyId' })

  const sourceSurvey = await SurveyManager.fetchSurveyById({ surveyId: sourceSurveyIdValidated })
  const sourceSurveyInfo = Survey.getSurveyInfo(sourceSurvey)
  if (!Authorizer.canViewSurvey(user, sourceSurveyInfo)) {
    throw new UnauthorizedError(User.getName(user))
  }

  return CategoryManager.cloneCategoryFromSurvey({
    user,
    sourceSurveyId: sourceSurveyIdValidated,
    sourceCategoryUuid,
    targetSurveyId: targetSurveyIdValidated,
  })
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
  countItemsByParentUuid,
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
  updateItemsIndex,

  deleteCategory,
  deleteLevel,
  deleteItem,

  initializeSurveyCategoryItemsIndexes,
  initializeAllSurveysCategoryItemIndexes,
} = CategoryManager
