import * as JobManager from '@server/job/jobManager'
import * as SurveyManager from '../manager/surveyManager'

import SurveyPublishJob from './publish/surveyPublishJob'

// JOBS
export const startPublishJob = (user, surveyId) => {
  const job = new SurveyPublishJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

// CREATE
export const createSurvey = SurveyManager.createSurvey
export const validateNewSurvey = SurveyManager.validateNewSurvey

// READ
export const fetchUserSurveysInfo = SurveyManager.fetchUserSurveysInfo
export const countUserSurveys = SurveyManager.countUserSurveys
export const fetchSurveyById = SurveyManager.fetchSurveyById
export const fetchSurveyAndNodeDefsBySurveyId =
  SurveyManager.fetchSurveyAndNodeDefsBySurveyId

// UPDATE
export const updateSurveyProps = SurveyManager.updateSurveyProps

// DELETE
export const deleteSurvey = SurveyManager.deleteSurvey
