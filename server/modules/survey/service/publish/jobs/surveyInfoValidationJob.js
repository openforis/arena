const Job = require('../../../../../job/job')

const Validator = require('../../../../../../common/validation/validator')
const Validation = require('../../../../../../common/validation/validation')
const Survey = require('../../../../../../common/survey/survey')

const SurveyManager = require('../../../manager/surveyManager')

class SurveyInfoValidationJob extends Job {

  constructor (params) {
    super(SurveyInfoValidationJob.type, params)
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyById(this.surveyId, true, true, tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const validation = Validator.getValidation(surveyInfo)

    if (!Validation.isValid(validation)) {
      this.errors = {
        'info': Validation.getFieldValidations(validation)
      }
      await this.setStatusFailed()
    }
  }
}

SurveyInfoValidationJob.type = 'SurveyInfoValidationJob'

module.exports = SurveyInfoValidationJob