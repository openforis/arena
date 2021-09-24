import Job from '@server/job/job'

import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'

export default class SurveyRdbSchemaCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbSchemaCreationJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    const jobDescription = `drop and create schema for survey ${surveyId}`
    this.logDebug(`${jobDescription} - start`)
    await SurveyRdbManager.dropSchema(surveyId, tx)
    await SurveyRdbManager.createSchema(surveyId, tx)
    this.logDebug(`${jobDescription} - end`)
  }
}

SurveyRdbSchemaCreationJob.type = 'SurveyRdbSchemaCreationJob'
