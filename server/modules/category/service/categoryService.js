import * as JobManager from '@server/job/jobManager'

import * as Category from '@core/survey/category'

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

export const exportAllCategories = async ({ user, surveyId, draft }) => {
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
