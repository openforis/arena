import * as JobManager from '@server/job/jobManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

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

export const exportCategoryCodeLevels = async (surveyId, categoryUuid, draft, res) => {
  const levels = await CategoryManager.fetchLevelsByCategoryUuid(surveyId, categoryUuid, draft)

  if (levels.length <= 0) {
    Response.setContentTypeFile(res, 'template_code_list_hierarchical.csv', null, Response.contentTypes.csv)
    await CSVWriter.writeToStream(res, [
      { level_1_code: 1, level_1_en: 'label_1', level_2_code: '', level_2_en: '' },
      { level_1_code: 1, level_1_en: 'label_1', level_2_code: 1, level_2_en: 'label_1_1' },
      { level_1_code: 1, level_1_en: 'label_1', level_2_code: 2, level_2_en: 'label_1_2' },
      { level_1_code: 2, level_1_en: 'label_2', level_2_code: '', level_2_en: '' },
    ])
    return
  }

  // get survey languages
  const survey = await SurveyManager.fetchSurveyById(surveyId, draft, false)
  const languages = R.pipe(Survey.getSurveyInfo, Survey.getLanguages)(survey)

  // get category to generate the file name
  const category = await CategoryManager.fetchCategoryUuid(surveyId, categoryUuid, draft)

  // Function to prepare the csv headers
  const _getHeaders = (levelsInCategory) =>
    levelsInCategory
      .sort((la, lb) => la.index - lb.index)
      .reduce(
        (headers, level) => [
          ...headers,
          `${CategoryLevel.getName(level)}_code`,
          ...(languages || []).map((language) => `${CategoryLevel.getName(level)}_label_${language}`),
        ],
        []
      )

  // get headers
  const headers = _getHeaders(levels)

  const categoriesItemsStream = await CategoryManager.fetchCategoryCodesListStream({
    surveyId,
    categoryUuid,
    levels,
    headers,
    languages,
  })

  const fileName = `${Category.getName(category) || 'category'}_code_list_hierarchical.csv`
  Response.setContentTypeFile(res, fileName, null, Response.contentTypes.csv)

  await db.stream(categoriesItemsStream, (stream) => {
    stream.pipe(CSVWriter.transformToStream(res, headers))
  })
}

export const {
  insertCategory,
  createImportSummary,
  createImportSummaryFromStream,
  insertLevel,
  insertItem,

  countCategories,
  fetchCategoriesBySurveyId,
  fetchCategoriesAndLevelsBySurveyId,
  fetchCategoryUuid,
  fetchCategoryAndLevelsByUuid,
  fetchLevelsByCategoryUuid,
  fetchItemsByCategoryUuid,
  fetchItemsByParentUuid,
  fetchCategoryCodesListStream,

  updateCategoryProp,
  updateLevelProp,
  updateItemProp,

  deleteCategory,
  deleteLevel,
  deleteItem,
} = CategoryManager
