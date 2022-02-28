import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import * as ActivityLogService from '@server/modules/activityLog/service/activityLogService'
import { ExportFile } from '../exportFile'

const BATCH_SIZE = 5000

export default class ActivityLogExportJob extends Job {
  constructor(params) {
    super('ActivityLogExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const count = await ActivityLogService.count({ surveyId }, this.tx)
    this.total = Math.ceil(count / BATCH_SIZE)

    await PromiseUtils.each([...Array(this.total).keys()], async (index) => {
      const offset = index * BATCH_SIZE
      const activityLog = await ActivityLogService.fetchSimple({ surveyId, limit: BATCH_SIZE, offset }, this.tx)
      const activityLogString = JSON.stringify(activityLog, null, 2)
      archive.append(activityLogString, { name: ExportFile.activityLog({ index }) })
      this.incrementProcessedItems()
    })
  }
}
