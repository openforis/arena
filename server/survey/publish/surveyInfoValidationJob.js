const Job = require('../../job/job')

const Validator = require('../../../common/validation/validator')

const SurveyManager = require('../../survey/surveyManager')

class SurveyInfoValidationJob extends Job {

  constructor (params) {
    super(SurveyInfoValidationJob.type, params)
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyById(this.surveyId, true, true, tx)

    if (!Validator.isValid(survey)) {
      this.errors = {surveyInfo: Validator.getInvalidFieldValidations(validation)}
      this.setStatusFailed()
    }
  }
}

SurveyInfoValidationJob.type = 'SurveyInfoValidationJob'

module.exports = SurveyInfoValidationJob