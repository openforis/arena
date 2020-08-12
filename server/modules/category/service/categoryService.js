import * as JobManager from '@server/job/jobManager'
import * as CategoryManager from '../manager/categoryManager'
import CategoryImportJob from './categoryImportJob'
import * as CategoryImportJobParams from './categoryImportJobParams'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as R from 'ramda'
import * as Survey from '@core/survey/survey'
import * as Response from '@server/utils/response'
import * as CSVWriter from '@server/utils/file/csvWriter'
import { db } from '@server/db/db'

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
  const survey = await SurveyManager.fetchSurveyById(surveyId, draft, false)
  const defaultLang = R.pipe(Survey.getSurveyInfo, Survey.getDefaultLanguage)(survey)
  const languages = R.pipe(Survey.getSurveyInfo, Survey.getLanguages)(survey)

  const category = await CategoryManager.fetchCategoryUuid(surveyId, categoryUuid, draft)

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

  const _getHeaders = (levelsInCategory) =>
    levelsInCategory
      .sort((la, lb) => la.index - lb.index)
      .reduce((headers, l) => [...headers, `${l.props.name}_code`, `${l.props.name}_label_${defaultLang}`], []) //improve getting languages

  const headers = _getHeaders(levels)

  const categoriesItemsStream = await CategoryManager.fetchCategoryCodesListStream(
    surveyId,
    categoryUuid,
    levels,
    headers,
    languages
  )

  const fileName = `${category.props.name || 'category'}_code_list_hierarchical.csv`
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
