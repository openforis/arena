import * as R from 'ramda';
import db from '../../../db/db';
import Survey from '../../../../core/survey/survey';
import SurveyManager from '../../survey/manager/surveyManager';
import CollectImportReportManager from '../manager/collectImportReportManager';
import JobManager from '../../../job/jobManager';
import CollectImportJob from './collectImport/collectImportJob';

const startCollectImportJob = (user, filePath) => {
  const job = new CollectImportJob({ user, filePath })

  JobManager.executeJobThread(job)

  return job
}

const updateReportItem = async (user, surveyId, itemId, props, resolved, client: any = db) =>
  await client.tx(async tx => {
    //1. update import report item
    const itemUpdated = await CollectImportReportManager.updateItem(surveyId, itemId, props, resolved, tx)

    //2. update survey collect report items count
    const survey = await SurveyManager.fetchSurveyById(surveyId, true, false, tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const collectReport = Survey.getCollectReport(surveyInfo)
    const issuesResolved: number = R.propOr(0, Survey.collectReportKeys.issuesResolved)(collectReport)
    const issuesResolvedUpdated = issuesResolved + (resolved ? 1 : -1)

    const collectReportUpdated = {
      ...collectReport,
      [Survey.collectReportKeys.issuesResolved]: issuesResolvedUpdated
    }
    await SurveyManager.updateSurveyProp(user, surveyId, Survey.infoKeys.collectReport, collectReportUpdated, tx)

    return itemUpdated
  })

export default {
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
};
