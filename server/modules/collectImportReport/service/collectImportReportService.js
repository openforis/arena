const CollectImportReportManager = require('../persistence/collectImportReportManager')

module.exports = {
  insertItem: CollectImportReportManager.insertItem,
  fetchItems: CollectImportReportManager.fetchItems,
  updateItem: CollectImportReportManager.updateItem
}