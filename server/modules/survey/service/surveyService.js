const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const Validator = require('../../../../common/validation/validator')

const SurveyManager = require('../manager/surveyManager')

const JobManager = require('../../../job/jobManager')
const SurveyPublishJob = require('./publish/surveyPublishJob')

const updateSurveyProp = async (user, surveyId, key, value) => {
  const survey = await SurveyManager.updateSurveyProp(user, surveyId, key, value)

  return R.pipe(
    Survey.getSurveyInfo,
    Validator.getValidation
  )(survey)
}

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
  fetchSurveyById: SurveyManager.fetchSurveyById,
  fetchSurveyAndNodeDefsBySurveyId: SurveyManager.fetchSurveyAndNodeDefsBySurveyId,

  // UPDATE
  updateSurveyProp,

  // DELETE
  deleteSurvey: SurveyManager.deleteSurvey,

  // JOBS
  startPublishJob,
}