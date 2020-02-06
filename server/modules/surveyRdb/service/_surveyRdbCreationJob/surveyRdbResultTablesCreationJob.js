import Job from '@server/job/job'

import * as SurveyRdbManager from '../../manager/surveyRdbManager'

export default class SurveyRdbResultTablesCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbResultTablesCreationJob.type, params)
  }

  async execute() {
    await SurveyRdbManager.createNodeAnalysisTable(this.surveyId, this.tx)
  }
}

SurveyRdbResultTablesCreationJob.type = 'SurveyRdbResultTablesCreationJob'
