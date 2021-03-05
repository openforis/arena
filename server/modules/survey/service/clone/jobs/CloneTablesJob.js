import Job from '@server/job/job'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as ActivityLog from '@common/activityLog/activityLog'

export default class CloneTablesJob extends Job {
  constructor(params) {
    super('CloneTablesJob', params)

    this.tables = params.tables
  }

  async execute() {
    const { surveyId: clonedSurveyId, newSurveyId, surveyInfo, user } = this.context

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

    await ActivityLogRepository.insert(user, newSurveyId, ActivityLog.type.surveyCreate, surveyInfo, false, this.tx)
  }
}
