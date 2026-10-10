import Job from '@server/job/job'
import * as DbUtils from '@server/db/dbUtils'
import * as SurveyManager from '../manager/surveyManager'
import { Schemata } from '@openforis/arena-server'

export default class SurveyActivityLogClearJob extends Job {
  constructor(params) {
    super(SurveyActivityLogClearJob.type, params)
  }

  async execute() {
    const { context, tx } = this
    const { surveyId } = context

    this.total = 1

    await SurveyManager.deleteAllActivityLog({ surveyId }, tx)
    this.incrementProcessedItems()
  }

  async onEnd() {
    await super.onEnd()
    if (!this.isSucceeded()) return
    // VACUUM after the delete has been committed: before that, the deleted rows are not dead yet
    try {
      const schema = Schemata.getSchemaSurvey(this.context.surveyId)
      await DbUtils.vacuumTable({ schema, table: 'activity_log' })
    } catch (error) {
      this.logWarn(`error running VACUUM on activity_log: ${error}`)
    }
  }
}

SurveyActivityLogClearJob.type = 'SurveyActivityLogClearJob'
