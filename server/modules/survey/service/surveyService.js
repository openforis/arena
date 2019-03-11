const R = require('ramda')

const Survey = require('../../../../common/survey/survey')

const SurveyManager = require('../persistence/surveyManager')
const SurveyValidator = require('../surveyValidator')

const JobManager = require('../../../job/jobManager')
const SurveyPublishJob = require('./publish/surveyPublishJob')
const CollectImportJob = require('./collectImport/collectImportJob')

const updateSurveyProp = async (user, surveyId, key, value) => {
  const survey = await SurveyManager.updateSurveyProp(surveyId, key, value, user)

  return R.pipe(
    Survey.getSurveyInfo,
    Validator.getValidation
  )(survey)
}

const startCollectImportJob = (user, filePath) => {
  const job = new CollectImportJob({ user, filePath })

  JobManager.executeJobThread(job)

  return job
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
  startCollectImportJob,
  startPublishJob,
}