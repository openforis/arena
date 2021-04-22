import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'
import * as SurveyManager from '../manager/surveyManager'

import SurveyPublishJob from './publish/surveyPublishJob'
import SurveyCloneJob from './clone/surveyCloneJob'
import ExportCsvDataJob from './export/exportCsvDataJob'
import SurveyExportJob from './surveyExport/surveyExportJob'

// JOBS
export const startPublishJob = (user, surveyId) => {
  const job = new SurveyPublishJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

export const exportSurvey = ({ surveyId, user }) => {
  const outputFileName = `survey_export_${surveyId}_${Date.now()}.zip`
  const job = new SurveyExportJob({ surveyId, user, outputFileName })

  JobManager.executeJobThread(job)

  return { job: JobUtils.jobToJSON(job), outputFileName }
}

export const cloneSurvey = ({ user, surveyIdSource, surveyInfoTarget }) => {
  const job = new SurveyCloneJob({ user, surveyIdSource, surveyInfoTarget })
  JobManager.executeJobThread(job)
  return JobUtils.jobToJSON(job)
}

export const startExportCsvDataJob = ({ surveyId, user }) => {
  const job = new ExportCsvDataJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

export const {
  // CREATE
  insertSurvey,
  // READ
  fetchUserSurveysInfo,
  countUserSurveys,
  fetchSurveyById,
  fetchSurveyAndNodeDefsBySurveyId,
  // UPDATE
  updateSurveyProps,
  // DELETE
  deleteSurvey,
  // UTILS
  validateNewSurvey,
} = SurveyManager
