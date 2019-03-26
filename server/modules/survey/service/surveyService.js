const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const Validator = require('../../../../common/validation/validator')

const SurveyManager = require('../persistence/surveyManager')
const SurveyValidator = require('../surveyValidator')

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

  validateNewSurvey: SurveyValidator.validateNewSurvey,

  // CREATE
  createSurvey: SurveyManager.createSurvey,

  // READ
  fetchUserSurveysInfo: SurveyManager.fetchUserSurveysInfo,
  fetchSurveyById: SurveyManager.fetchSurveyById,

  // UPDATE
  updateSurveyProp,

  // DELETE
  deleteSurvey: SurveyManager.deleteSurvey,

  // JOBS
  startPublishJob,
}