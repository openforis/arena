const db = require('../../../db/db')

const CollectImportReportRepository = require('./collectImportReportRepository')

const resolveItem = async (surveyId, itemId, client = db) =>
  await CollectImportReportRepository.updateItem(surveyId, itemId, {}, true, client)

module.exports = {
  insertItem: CollectImportReportRepository.insertItem,

  // READ
  fetchItems: CollectImportReportRepository.fetchItems,

  // UPDATE
  updateItem: CollectImportReportRepository.updateItem,
  resolveItem
}