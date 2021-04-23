import Job from '@server/job/job'
import * as ActivityLogService from '@server/modules/activityLog/service/activityLogService'
import { ExportFile } from '../exportFile'

export default class ActivityLogExportJob extends Job {
  constructor(params) {
    super('ActivityLogExportJob', params)
  }

  async execute() {
    const { archive, surveyId, user } = this.context

    const activityLog = await ActivityLogService.fetch({ user, surveyId, limit: 'ALL', orderBy: 'ASC' })
    archive.append(JSON.stringify(activityLog, null, 2), { name: ExportFile.activityLog })
  }
}
