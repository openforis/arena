import * as ActivityLog from '@common/activityLog/activityLog'

import Job from '@server/job/job'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'

import PrepareData from './jobs/PrepareData'

export default class ExportCsvDataJob extends Job {
  constructor(params) {
    super(ExportCsvDataJob.type, params, [new PrepareData()])
  }

  async onStart() {
    await super.onStart()

    await ActivityLogManager.insert(this.user, this.surveyId, ActivityLog.type.surveyPublish, null, false, this.tx)
  }

  async beforeSuccess() {
    const { exportDataFolderName } = this.context

    this.setResult({
      exportDataFolderName,
    })
  }

  async onEnd() {
    await super.onEnd()
  }
}

ExportCsvDataJob.type = 'ExportCsvDataJob'
