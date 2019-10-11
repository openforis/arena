const Job = require('../../../../../job/job')

const Validation = require('../../../../../../core/validation/validation')
const Survey = require('../../../../../../core/survey/survey')

const SurveyManager = require('../../../manager/surveyManager')

class SurveyInfoValidationJob extends Job {

  constructor (params) {
    super(SurveyInfoValidationJob.type, params)
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyById(this.surveyId, true, true, tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const validation = Validation.getValidation(surveyInfo)

    if (!Validation.isValid(validation)) {
      this.addError(Validation.getFieldValidations(validation), Survey.infoKeys.info)
      await this.setStatusFailed()
    }
  }
}

SurveyInfoValidationJob.type = 'SurveyInfoValidationJob'

module.exports = SurveyInfoValidationJob