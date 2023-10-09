import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'
import * as SurveyManager from '../manager/surveyManager'

import { RecordsUpdateThreadService } from '@server/modules/record/service/update/surveyRecordsThreadService'

import ExportCsvDataJob from './export/exportCsvDataJob'
import SurveyCloneJob from './clone/surveyCloneJob'
import SurveyExportJob from './surveyExport/surveyExportJob'
import SurveyPublishJob from './publish/surveyPublishJob'
import SurveyUnpublishJob from './unpublish/surveyUnpublishJob'
import { SchemaSummary } from './schemaSummary'

// JOBS
export const startPublishJob = (user, surveyId) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  const job = new SurveyPublishJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

export const startUnpublishJob = (user, surveyId) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  const job = new SurveyUnpublishJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

export const exportSurvey = ({ surveyId, user, includeData = false, includeActivityLog = true }) => {
  const outputFileName = `survey_export_${surveyId}_${Date.now()}.zip`
  const job = new SurveyExportJob({ surveyId, user, outputFileName, backup: includeData, includeActivityLog })

  JobManager.executeJobThread(job)

  return { job: JobUtils.jobToJSON(job), outputFileName }
}

export const cloneSurvey = ({ user, surveyId, surveyInfoTarget, cycle = null }) => {
  const job = new SurveyCloneJob({ user, surveyId, surveyInfoTarget, cycle })
  JobManager.executeJobThread(job)
  return JobUtils.jobToJSON(job)
}

export const startExportCsvDataJob = ({
  surveyId,
  cycle,
  user,
  includeCategories,
  includeCategoryItemsLabels,
  includeAnalysis,
  includeDataFromAllCycles,
  includeFiles,
}) => {
  const job = new ExportCsvDataJob({
    user,
    surveyId,
    cycle,
    includeCategories,
    includeCategoryItemsLabels,
    includeAnalysis,
    includeDataFromAllCycles,
    includeFiles,
  })

  JobManager.executeJobThread(job)

  return job
}

export const exportSchemaSummary = async ({ surveyId, cycle, outputStream }) =>
  SchemaSummary.exportSchemaSummary({ surveyId, cycle, outputStream })

export const deleteSurvey = async (surveyId) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  await SurveyManager.deleteSurvey(surveyId)
}

export const {
  // CREATE
  insertSurvey,
  // READ
  fetchUserSurveysInfo,
  countOwnedSurveys,
  countUserSurveys,
  fetchSurveyById,
  fetchSurveyAndNodeDefsBySurveyId,
  fetchSurveyAndNodeDefsAndRefDataBySurveyId,
  // UPDATE
  updateSurveyDependencyGraphs,
  updateSurveyProps,
  // DELETE
  deleteTemporarySurveys,
  // UTILS
  validateNewSurvey,
  validateSurveyClone,
  validateSurveyImportFromCollect,
} = SurveyManager
