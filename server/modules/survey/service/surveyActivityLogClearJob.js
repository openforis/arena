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

    this.total = 2

    await SurveyManager.deleteAllActivityLog({ surveyId }, tx)
    this.incrementProcessedItems()

    const schema = Schemata.getSchemaSurvey(surveyId)
    await DbUtils.vacuumTable({ schema, table: 'activity_log' })
    this.incrementProcessedItems()
  }
}

SurveyActivityLogClearJob.type = 'SurveyActivityLogClearJob'
