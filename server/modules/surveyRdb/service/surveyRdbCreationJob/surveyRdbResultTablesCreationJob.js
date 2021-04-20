import * as ProcessingChain from '../../../../../common/analysis/processingChain'

import Job from '../../../../job/job'

import * as SurveyManager from '../../../survey/manager/surveyManager'
import * as AnalysisManager from '../../../analysis/manager'
import * as SurveyRdbManager from '../../manager/surveyRdbManager'

export default class SurveyRdbResultTablesCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbResultTablesCreationJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    const [survey, chains] = await Promise.all([
      SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId }, tx),
      AnalysisManager.fetchChains({ surveyId, includeStepsAndCalculations: true }, tx),
      SurveyRdbManager.createResultNodeTable({ surveyId }, tx),
    ])

    await Promise.all(
      chains.map((chain) =>
        Promise.all(
          ProcessingChain.getProcessingSteps(chain).map((step) =>
            SurveyRdbManager.createResultStepView({ survey, step }, tx)
          )
        )
      )
    )
  }
}

SurveyRdbResultTablesCreationJob.type = 'SurveyRdbResultTablesCreationJob'
