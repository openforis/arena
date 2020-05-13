import * as JobManager from '@server/job/jobManager'
import * as SurveyManager from '../manager/surveyManager'

import SurveyPublishJob from './publish/surveyPublishJob'

// JOBS
export const startPublishJob = (user, surveyId) => {
  const job = new SurveyPublishJob({ user, surveyId })

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
