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
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid(surveyId, categoryUuid, draft)
  const numberOfItemsInCategory = await CategoryManager.countItemsByCategoryUuid(surveyId, categoryUuid)

  if (numberOfItemsInCategory <= 0) {
    return CategoryManager.getCategoryExportTemplate({ res })
  }

  const levels = Category.getLevelsArray(category)
  // get survey languages
  const survey = await SurveyManager.fetchSurveyById(surveyId, draft, false)
  const languages = R.pipe(Survey.getSurveyInfo, Survey.getLanguages)(survey)

  const { stream: categoryStream, headers } = CategoryManager.getCategoryStreamAndHeaders({
    surveyId,
    categoryUuid,
    levels,
    languages,
  })

  const fileName = `${Category.getName(category) || 'category'}_code_list_hierarchical.csv`

  Response.setContentTypeFile(res, fileName, null, Response.contentTypes.csv)

  return db.stream(categoryStream, (stream) => {
    stream.pipe(CSVWriter.transformToStream(res, headers))
  })
}

export const {
  insertCategory,
  createImportSummary,
  createImportSummaryFromStream,
  insertLevel,
  insertItem,
  insertItems,

  countCategories,
  fetchCategoriesBySurveyId,
  fetchCategoriesAndLevelsBySurveyId,
  fetchCategoryAndLevelsByUuid,
  fetchItemsByParentUuid,
  fetchItemsByCategoryUuid,

  updateCategoryProp,
  updateLevelProp,
  updateItemProp,

  deleteCategory,
  deleteLevel,
  deleteItem,
} = CategoryManager
