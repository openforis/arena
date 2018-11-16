const Job = require('../../job/job')

const {getInvalidFieldValidations} = require('../../../common/validation/validator')

const SurveyRepository = require('../../survey/surveyRepository')
const {validateSurvey} = require('../../survey/surveyValidator')

class SurveyInfoValidationJob extends Job {

  constructor (params) {
    super(SurveyInfoValidationJob.type, params)
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
      this.errors = {surveyInfo: getInvalidFieldValidations(validation)}
      this.setStatusFailed()
    }
  }
}

SurveyInfoValidationJob.type = 'SurveyInfoValidationJob'

module.exports = SurveyInfoValidationJob