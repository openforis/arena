const SurveyManager = require('../persistence/surveyManager')
const SurveyValidator = require('../surveyValidator')

module.exports = {
  validateNewSurvey: SurveyValidator.validateNewSurvey,

  // CREATE
  createSurvey: SurveyManager.createSurvey,

  // READ
  fetchUserSurveysInfo: SurveyManager.fetchUserSurveysInfo,
  fetchSurveyById: SurveyManager.fetchSurveyById,

  // UPDATE
  updateSurveyProp: SurveyManager.updateSurveyProp,

  // DELETE
  deleteSurvey: SurveyManager.deleteSurvey,
}
