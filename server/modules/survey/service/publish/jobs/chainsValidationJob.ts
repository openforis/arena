import * as Chain from '@common/analysis/chain'
import * as ChainValidator from '@common/analysis/chainValidator'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import Job, { type JobParams } from '@server/job/job'
import * as AnalysisManager from '@server/modules/analysis/manager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as DbUtils from '@server/db/dbUtils'

export default class ChainsValidationJob extends Job {
  static readonly type: string = 'ChainsValidationJob'

  constructor(params?: Partial<JobParams>) {
    super(ChainsValidationJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    const [survey, chains] = await DbUtils.runQueries(tx, [
      () => SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true }, tx),
      () => AnalysisManager.fetchChains({ surveyId }, tx),
    ])

    const defaultLang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))

    const validations = await Promise.all(
      chains.map((chain) => ChainValidator.validateChain({ chain, defaultLang, survey }))
    )
    for (const [index, validation] of validations.entries()) {
      if (!Validation.isValid(validation)) {
        const chain = chains[index]
        this.addError(Validation.getFieldValidations(validation), Chain.getLabel(defaultLang)(chain))
      }
    }

    if (this.hasErrors()) {
      await this.setStatusFailed()
    }
  }
}
