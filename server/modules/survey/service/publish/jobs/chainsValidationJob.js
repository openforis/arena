import Job from '@server/job/job'

import * as Chain from '../../../../../../common/analysis/processingChain'
import * as ChainValidator from '../../../../../../common/analysis/processingChainValidator'

import * as Survey from '../../../../../../core/survey/survey'
import * as Validation from '../../../../../../core/validation/validation'

import * as AnalysisManager from '../../../../analysis/manager'
import * as SurveyManager from '../../../manager/surveyManager'

export default class ChainsValidationJob extends Job {
  constructor(params) {
    super(ChainsValidationJob.type, params)
  }

  async execute() {
    const { surveyId } = this

    const chains = await AnalysisManager.fetchChains({
      surveyId,
      includeStepsAndCalculations: true,
    })

    const survey = await SurveyManager.fetchSurveyById(surveyId, true)
    const defaultLang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))

    const validations = await Promise.all(chains.map((chain) => ChainValidator.validateChain(chain, defaultLang)))
    validations.forEach((validation, index) => {
      if (!Validation.isValid(validation)) {
        const chain = chains[index]
        this.addError(Validation.getFieldValidations(validation), Chain.getLabel(defaultLang)(chain))
      }
    })

    if (this.hasErrors()) {
      await this.setStatusFailed()
    }
  }
}

ChainsValidationJob.type = 'ChainsValidationJob'
