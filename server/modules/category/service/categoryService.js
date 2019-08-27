const CategoryManager = require('../manager/categoryManager')
const JobManager = require('../../../job/jobManager')
const CategoryImportJob = require('./categoryImportJob')

const importCategory = (user, surveyId, categoryUuid, filePath) => {
  const job = new CategoryImportJob({
    user,
    surveyId,
    categoryUuid,
    filePath
  })

  JobManager.executeJobThread(job)

  return job
}

module.exports = {
  insertCategory: CategoryManager.insertCategory,
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