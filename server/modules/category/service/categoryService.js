import * as CategoryManager from '../manager/categoryManager'
import * as JobManager from '@server/job/jobManager'
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

export const insertCategory = CategoryManager.insertCategory
export const createImportSummary = CategoryManager.createImportSummary
export const createImportSummaryFromStream = CategoryManager.createImportSummaryFromStream
export const insertLevel = CategoryManager.insertLevel
export const insertItem = CategoryManager.insertItem

export const fetchCategoriesAndLevelsBySurveyId = CategoryManager.fetchCategoriesAndLevelsBySurveyId
export const fetchCategoryAndLevelsByUuid = CategoryManager.fetchCategoryAndLevelsByUuid
export const fetchItemsByParentUuid = CategoryManager.fetchItemsByParentUuid

export const updateCategoryProp = CategoryManager.updateCategoryProp
export const updateLevelProp = CategoryManager.updateLevelProp
export const updateItemProp = CategoryManager.updateItemProp

export const deleteCategory = CategoryManager.deleteCategory
export const deleteLevel = CategoryManager.deleteLevel
export const deleteItem = CategoryManager.deleteItem
