import Job from '@server/job/job'

import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'

import * as SurveyManager from '../../../manager/surveyManager'

export default class SurveyInfoValidationJob extends Job {
  constructor(params) {
    super(SurveyInfoValidationJob.type, params)
  }

  async execute() {
    const survey = await SurveyManager.fetchSurveyById(
      { surveyId: this.surveyId, draft: true, validate: true },
      this.tx
    )
    const surveyInfo = Survey.getSurveyInfo(survey)
    const validation = Validation.getValidation(surveyInfo)

    if (!Validation.isValid(validation)) {
      this.addError(Validation.getFieldValidations(validation), Survey.infoKeys.info)
      await this.setStatusFailed()
    }
  }
}

SurveyInfoValidationJob.type = 'SurveyInfoValidationJob'
