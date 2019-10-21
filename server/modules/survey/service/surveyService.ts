const SurveyManager = require('../manager/surveyManager')

const JobManager = require('../../../job/jobManager')
const SurveyPublishJob = require('./publish/surveyPublishJob')

const startPublishJob = (user, surveyId) => {
  const job = new SurveyPublishJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

module.exports = {
  // CREATE
  createSurvey: SurveyManager.createSurvey,
  validateNewSurvey: SurveyManager.validateNewSurvey,

  // READ
  fetchUserSurveysInfo: SurveyManager.fetchUserSurveysInfo,
  countUserSurveys: SurveyManager.countUserSurveys,
  fetchSurveyById: SurveyManager.fetchSurveyById,
  fetchSurveyAndNodeDefsBySurveyId: SurveyManager.fetchSurveyAndNodeDefsBySurveyId,

  // UPDATE
  updateSurveyProps: SurveyManager.updateSurveyProps,

  // DELETE
  deleteSurvey: SurveyManager.deleteSurvey,

  // JOBS
  startPublishJob,
}