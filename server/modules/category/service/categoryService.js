const CategoryManager = require('../persistence/categoryManager')

module.exports = {
  insertCategory: CategoryManager.insertCategory,
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