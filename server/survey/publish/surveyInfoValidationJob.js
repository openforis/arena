const Job = require('../../job/job')

const {getInvalidFieldValidations} = require('../../../common/validation/validator')

const SurveyRepository = require('../../survey/surveyRepository')
const {validateSurvey} = require('../../survey/surveyValidator')

class SurveyInfoValidationJob extends Job {

  constructor (userId, surveyId) {
    super('survey-info-validation', userId, surveyId)
  }

  async execute () {
    const surveyDb = await SurveyRepository.getSurveyById(this.surveyId, true)
    const survey = {
      info: {...surveyDb}
    }
    const validation = await validateSurvey(survey)
    if (validation.valid) {
      this.setStatusSucceeded()
    } else {
      this.errors = getInvalidFieldValidations(validation)
      this.setStatusFailed()
    }
  }
}

module.exports = SurveyInfoValidationJob