import * as Chain from '@common/analysis/processingChain'
import * as ChainValidator from '@common/analysis/processingChainValidator'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import Job from '@server/job/job'
import * as AnalysisManager from '@server/modules/analysis/manager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { ChainNodeDefRepository } from '@server/modules/analysis/repository/chainNodeDef'

export default class ChainsValidationJob extends Job {
  constructor(params) {
    super(ChainsValidationJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    const [survey, chains] = await Promise.all([
      SurveyManager.fetchSurveyById({ surveyId, draft: true }, tx),
      AnalysisManager.fetchChains({ surveyId }, tx),
    ])

    const defaultLang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))

    const validations = await Promise.all(
      chains.map(async (chain) => {
        const chainNodeDefsCount = await ChainNodeDefRepository.count({ surveyId, chainUuid: chain.uuid }, tx)
        return ChainValidator.validateChain(chain, chainNodeDefsCount, defaultLang)
      })
    )
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
