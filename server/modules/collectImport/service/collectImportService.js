const JobManager = require('../../../job/jobManager')

const CollectImportReportManager = require('../persistence/collectImportReportManager')
const CollectImportJob = require('./collectImport/collectImportJob')

const startCollectImportJob = (user, filePath) => {
  const job = new CollectImportJob({ user, filePath })

  JobManager.executeJobThread(job)

  return job
}

module.exports = {
  // COLLECT SURVEY IMPORT
  startCollectImportJob,

  // REPORT ITEMS
  // CREATE
  insertReportItem: CollectImportReportManager.insertItem,
  // READ
  fetchReportItems: CollectImportReportManager.fetchItems,
  countReportItems: CollectImportReportManager.countItems,
  // UPDATE
  updateReportItem: CollectImportReportManager.updateItem

}