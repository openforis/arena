import * as R from 'ramda'

import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'

import * as JobManager from '@server/job/jobManager'
import * as SurveyManager from '../../survey/manager/surveyManager'
import * as CollectImportReportManager from '../manager/collectImportReportManager'
import CollectImportJob from './collectImport/collectImportJob'

// COLLECT SURVEY IMPORT
export const startCollectImportJob = ({ user, filePath, newSurvey, options }) => {
  const job = new CollectImportJob({ user, filePath, newSurvey, options })

  JobManager.executeJobThread(job)

  return job
}

// REPORT ITEMS

// CREATE
export const insertReportItem = CollectImportReportManager.insertItem

// READ
export const fetchReportItems = CollectImportReportManager.fetchItems
export const countReportItems = CollectImportReportManager.countItems
export const fetchReportItemsStream = CollectImportReportManager.fetchItemsStream

// UPDATE
export const updateReportItem = async (user, surveyId, itemId, props, resolved, client = db) =>
  client.tx(async (tx) => {
    // 1. update import report item
    const itemUpdated = await CollectImportReportManager.updateItem(surveyId, itemId, props, resolved, tx)

    // 2. update survey collect report items count
    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const collectReport = Survey.getCollectReport(surveyInfo)
    const issuesResolved = R.propOr(0, Survey.collectReportKeys.issuesResolved)(collectReport)
    const issuesResolvedUpdated = issuesResolved + (resolved ? 1 : -1)

    const collectReportUpdated = {
      ...collectReport,
      [Survey.collectReportKeys.issuesResolved]: issuesResolvedUpdated,
    }
    await SurveyManager.updateSurveyProp(user, surveyId, Survey.infoKeys.collectReport, collectReportUpdated, false, tx)

    return itemUpdated
  })
