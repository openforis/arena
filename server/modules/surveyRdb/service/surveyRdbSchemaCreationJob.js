import Job from '@server/job/job'

import * as SurveyRdbManager from '../manager/surveyRdbManager'

export default class SurveyRdbSchemaCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbSchemaCreationJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    this.logDebug('drop and create schema - start')
    await SurveyRdbManager.dropSchema(surveyId, tx)
    await SurveyRdbManager.createSchema(surveyId, tx)
    this.logDebug('drop and create schema - end')
  }
}

SurveyRdbSchemaCreationJob.type = 'SurveyRdbSchemaCreationJob'
