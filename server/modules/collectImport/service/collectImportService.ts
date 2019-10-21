const R = require('ramda')

const db = require('../../../db/db')

const Survey = require('../../../../core/survey/survey')

const SurveyManager = require('../../survey/manager/surveyManager')
const CollectImportReportManager = require('../manager/collectImportReportManager')
const JobManager = require('../../../job/jobManager')
const CollectImportJob = require('./collectImport/collectImportJob')

const startCollectImportJob = (user, filePath) => {
  const job = new CollectImportJob({ user, filePath })

  JobManager.executeJobThread(job)

  return job
}

const updateReportItem = async (user, surveyId, itemId, props, resolved, client = db) =>
  await client.tx(async tx => {
    //1. update import report item
    const itemUpdated = await CollectImportReportManager.updateItem(surveyId, itemId, props, resolved, tx)

    //2. update survey collect report items count
    const survey = await SurveyManager.fetchSurveyById(surveyId, true, false, tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const collectReport = Survey.getCollectReport(surveyInfo)
    const issuesResolved = R.propOr(0, Survey.collectReportKeys.issuesResolved)(collectReport)
    const issuesResolvedUpdated = issuesResolved + (resolved ? 1 : -1)

    const collectReportUpdated = {
      ...collectReport,
      [Survey.collectReportKeys.issuesResolved]: issuesResolvedUpdated
    }
    await SurveyManager.updateSurveyProp(user, surveyId, Survey.infoKeys.collectReport, collectReportUpdated, tx)

    return itemUpdated
  })

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
  updateReportItem
}