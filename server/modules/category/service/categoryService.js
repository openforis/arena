const CategoryManager = require('../manager/categoryManager')
const JobManager = require('../../../job/jobManager')
const CategoryImportJob = require('./categoryImportJob')
const CategoryImportCSVParser = require('./categoryImportCSVParser')
const CategoryImportJobParams = require('./categoryImportJobParams')

const importCategory = (user, surveyId, categoryUuid, summary) => {
  const job = new CategoryImportJob({
    user,
    surveyId,
    [CategoryImportJobParams.keys.categoryUuid]: categoryUuid,
    [CategoryImportJobParams.keys.summary]: summary,
  })

  JobManager.executeJobThread(job)

  return job
}

module.exports = {
  insertCategory: CategoryManager.insertCategory,
  createImportSummary: CategoryImportCSVParser.createImportSummary,
  importCategory,
  insertLevel: CategoryManager.insertLevel,
  insertItem: CategoryManager.insertItem,

  fetchCategoryByUuid: CategoryManager.fetchCategoryByUuid,
  fetchCategoriesBySurveyId: CategoryManager.fetchCategoriesBySurveyId,
  fetchItemsByParentUuid: CategoryManager.fetchItemsByParentUuid,
  fetchItemByUuid: CategoryManager.fetchItemByUuid,

  updateCategoryProp: CategoryManager.updateCategoryProp,
  updateLevelProp: CategoryManager.updateLevelProp,
  updateItemProp: CategoryManager.updateItemProp,

  deleteCategory: CategoryManager.deleteCategory,
  deleteLevel: CategoryManager.deleteLevel,
  deleteItem: CategoryManager.deleteItem,
}