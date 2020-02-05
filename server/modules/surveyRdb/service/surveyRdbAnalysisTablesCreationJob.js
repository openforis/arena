import Job from '@server/job/job'

import * as SurveyRdbManager from '../manager/surveyRdbManager'

export default class SurveyRdbAnalysisTablesCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbAnalysisTablesCreationJob.type, params)
  }

  async execute() {
    await SurveyRdbManager.createNodeAnalysisTable(this.surveyId, this.tx)
  }
}

SurveyRdbAnalysisTablesCreationJob.type = 'SurveyRdbAnalysisTablesCreationJob'
