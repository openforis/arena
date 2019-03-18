const CollectImportReportRepository = require('./collectImportReportRepository')

module.exports = {
  insertItem: CollectImportReportRepository.insertItem,

  // READ
  fetchItems: CollectImportReportRepository.fetchItems,

  // UPDATE
  updateItem: CollectImportReportRepository.updateItem
}