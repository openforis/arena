const Job = require('../../job/job')

const Validator = require('../../../common/validation/validator')
const Survey = require('../../../common/survey/survey')

const SurveyManager = require('../../survey/surveyManager')

class SurveyInfoValidationJob extends Job {

  constructor (params) {
    super(SurveyInfoValidationJob.type, params)
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyById(this.surveyId, true, true, tx)
    const surveyInfo = Survey.getSurveyInfo(survey)

    if (!Validator.isValid(surveyInfo)) {
      this.errors = { surveyInfo: Validator.getInvalidFieldValidations(Validator.getValidation(surveyInfo)) }
      this.setStatusFailed()
    }
  }
}

SurveyInfoValidationJob.type = 'SurveyInfoValidationJob'

module.exports = SurveyInfoValidationJob