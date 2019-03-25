const CollectImportReportManager = require('../persistence/collectImportReportManager')

module.exports = {
  // CREATE
  insertItem: CollectImportReportManager.insertItem,
  // READ
  fetchItems: CollectImportReportManager.fetchItems,
  countItems: CollectImportReportManager.countItems,
  // UPDATE
  updateItem: CollectImportReportManager.updateItem
}