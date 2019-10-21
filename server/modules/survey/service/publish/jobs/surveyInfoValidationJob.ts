import Job from '../../../../../job/job';

import Validation from '../../../../../../core/validation/validation';
import Survey from '../../../../../../core/survey/survey';

import SurveyManager from '../../../manager/surveyManager';

export default class SurveyInfoValidationJob extends Job {
  static type: string = 'SurveyInfoValidationJob'

  constructor (params?) {
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
