const R = require('ramda')

const Job = require('../../../../../job/job')

const Validator = require('../../../../../../common/validation/validator')
const Survey = require('../../../../../../common/survey/survey')

const SurveyManager = require('../../../manager/surveyManager')

const keys = {
  surveyInfoPrefix: 'survey.info',
  surveyInfoLabel: 'survey.info.label'
}

class SurveyInfoValidationJob extends Job {

  constructor (params) {
    super(SurveyInfoValidationJob.type, params)
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyById(this.getSurveyId(), true, true, tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const validation = Validator.getValidation(surveyInfo)

    if (!Validator.isValidationValid(validation)) {
      this.errors = {
        [keys.surveyInfoLabel]: Validator.getInvalidFieldValidations(validation, keys.surveyInfoPrefix)
      }
      await this.setStatusFailed()
    }
  }
}

SurveyInfoValidationJob.type = 'SurveyInfoValidationJob'

module.exports = SurveyInfoValidationJob