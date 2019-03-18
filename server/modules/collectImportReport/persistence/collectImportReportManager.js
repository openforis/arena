const CollectImportReportRepository = require('./collectImportReportRepository')

module.exports = {
  insertItem: CollectImportReportRepository.insertItem,

  // READ
  fetchItems: CollectImportReportRepository.fetchItems,
  countItems: CollectImportReportRepository.countItems,

  // UPDATE
  updateItem: CollectImportReportRepository.updateItem
}