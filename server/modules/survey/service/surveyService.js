import * as Survey from '@core/survey/survey'

import * as Response from '@server/utils/response'

import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'
import * as SurveyManager from '../manager/surveyManager'

import SurveyPublishJob from './publish/surveyPublishJob'
import SurveyCloneJob from './clone/surveyCloneJob'
import ExportCsvDataJob from './export/exportCsvDataJob'
import SurveyBackupJob from './backup/surveyBackupJob'

// JOBS
export const startPublishJob = (user, surveyId) => {
  const job = new SurveyPublishJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

export const exportSurvey = async ({ surveyId, res, user }) => {
  const job = new SurveyBackupJob({ surveyId, user })
  await job.start()
  const { survey, outputFilePath } = job.result
  Response.setContentTypeFile(res)
  Response.sendFile({ res, filePath: outputFilePath, fileNameOutput: `survey_${Survey.getName(survey)}.zip` })
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
