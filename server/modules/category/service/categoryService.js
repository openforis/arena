import * as JobManager from '@server/job/jobManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as Category from '@core/survey/category'

import * as R from 'ramda'
import * as Survey from '@core/survey/survey'
import * as Response from '@server/utils/response'
import * as CSVWriter from '@server/utils/file/csvWriter'
import { db } from '@server/db/db'
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

export const exportCategory = async (surveyId, categoryUuid, draft, res) => {
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft })
  const numberOfItemsInCategory = await CategoryManager.countItemsByCategoryUuid(surveyId, categoryUuid)

  if (numberOfItemsInCategory <= 0) {
    return CategoryManager.getCategoryExportTemplate({ res })
  }

  const levels = Category.getLevelsArray(category)

  // get survey languages
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
  const languages = R.pipe(Survey.getSurveyInfo, Survey.getLanguages)(survey)

  const {
    stream: categoryStream,
    headers = [],
    extraPropsHeaders = [],
  } = CategoryManager.getCategoryStreamAndHeaders({
    surveyId,
    categoryUuid,
    levels,
    languages,
    category,
  })

  const fileName = `${Category.getName(category) || 'category'}_code_list_hierarchical.csv`

  Response.setContentTypeFile(res, fileName, null, Response.contentTypes.csv)

  return db.stream(categoryStream, (stream) => {
    stream.pipe(CSVWriter.transformToStream(res, [...headers, ...extraPropsHeaders]))
  })
}

export const exportAllCategories = async ({ surveyId, draft }) => {
  const job = new CategoriesExportJob({
    user,
    surveyId,
    draft,
  })

  JobManager.executeJobThread(job)

  return job
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

  updateCategoryProp,
  cleanupCategory,
  updateLevelProp,
  updateItemProp,

  deleteCategory,
  deleteLevel,
  deleteItem,
} = CategoryManager
