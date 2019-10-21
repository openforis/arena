import CategoryManager from '../manager/categoryManager';
import JobManager from '../../../job/jobManager';
import CategoryImportJob from './categoryImportJob';
import CategoryImportJobParams from './categoryImportJobParams';

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

export default {
  insertCategory: CategoryManager.insertCategory,
  createImportSummary: CategoryManager.createImportSummary,
  createImportSummaryFromStream: CategoryManager.createImportSummaryFromStream,
  importCategory,
  insertLevel: CategoryManager.insertLevel,
  insertItem: CategoryManager.insertItem,

  fetchCategoriesAndLevelsBySurveyId: CategoryManager.fetchCategoriesAndLevelsBySurveyId,
  fetchCategoryAndLevelsByUuid: CategoryManager.fetchCategoryAndLevelsByUuid,
  fetchItemsByParentUuid: CategoryManager.fetchItemsByParentUuid,

  updateCategoryProp: CategoryManager.updateCategoryProp,
  updateLevelProp: CategoryManager.updateLevelProp,
  updateItemProp: CategoryManager.updateItemProp,

  deleteCategory: CategoryManager.deleteCategory,
  deleteLevel: CategoryManager.deleteLevel,
  deleteItem: CategoryManager.deleteItem,
};
