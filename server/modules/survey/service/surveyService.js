import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'
import * as SurveyManager from '../manager/surveyManager'

import SurveyPublishJob from './publish/surveyPublishJob'
import SurveyCloneJob from './clone/surveyCloneJob'
import ExportCsvDataJob from './export/exportCsvDataJob'
import SurveyExportJob from './surveyExport/surveyExportJob'
import { SchemaSummary } from './schemaSummary'

// JOBS
export const startPublishJob = (user, surveyId) => {
  const job = new SurveyPublishJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

export const exportSurvey = ({ surveyId, user, includeData = false, includeActivityLog = true }) => {
  const outputFileName = `survey_export_${surveyId}_${Date.now()}.zip`
  const job = new SurveyExportJob({ surveyId, user, outputFileName, backup: includeData, includeActivityLog })

  JobManager.executeJobThread(job)

  return { job: JobUtils.jobToJSON(job), outputFileName }
}

export const cloneSurvey = ({ user, surveyId, surveyInfoTarget }) => {
  const job = new SurveyCloneJob({ user, surveyId, surveyInfoTarget })
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
}) => {
  const job = new ExportCsvDataJob({
    user,
    surveyId,
    cycle,
    includeCategories,
    includeCategoryItemsLabels,
    includeAnalysis,
  })

  JobManager.executeJobThread(job)

  return job
}

export const exportSchemaSummary = async ({ surveyId, cycle, outputStream }) =>
  SchemaSummary.exportSchemaSummary({ surveyId, cycle, outputStream })

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
  deleteSurvey,
  deleteTemporarySurveys,
  // UTILS
  validateNewSurvey,
  validateSurveyClone,
} = SurveyManager
