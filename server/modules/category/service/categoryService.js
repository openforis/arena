import * as JobManager from '@server/job/jobManager'
import * as CategoryManager from '../manager/categoryManager'
import CategoryImportJob from './categoryImportJob'
import * as CategoryImportJobParams from './categoryImportJobParams'

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

export const {
  insertCategory,
  createImportSummary,
  createImportSummaryFromStream,
  insertLevel,
  insertItem,

  countCategories,
  fetchCategoriesAndLevelsBySurveyId,
  fetchCategoryAndLevelsByUuid,
  fetchItemsByParentUuid,

  updateCategoryProp,
  updateLevelProp,
  updateItemProp,

  deleteCategory,
  deleteLevel,
  deleteItem,
} = CategoryManager
