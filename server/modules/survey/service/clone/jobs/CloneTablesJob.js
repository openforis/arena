import Job from '@server/job/job'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

export default class CloneTablesJob extends Job {
  constructor(params) {
    super('CloneTablesJob', params)

    this.tables = params.tables
  }

  async execute() {
    const { surveyId: clonedSurveyId, newSurveyId } = this.context

    await Promise.all(
      this.tables.map(async (table) =>
        SurveyManager.cloneTables(
          {
            sourceId: clonedSurveyId,
            destinationId: newSurveyId,
            table,
          },
          this.tx
        )
      )
    )
  }
}
