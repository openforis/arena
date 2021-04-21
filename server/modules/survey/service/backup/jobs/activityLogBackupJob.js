import Job from '@server/job/job'
import * as ActivityLogService from '@server/modules/activityLog/service/activityLogService'
import * as FileUtils from '@server/utils/file/fileUtils'

export default class ActivityLogBackupJob extends Job {
  constructor(params) {
    super('ActivityLogBackupJob', params)
  }

  async execute() {
    const { archive, surveyId, user } = this.context

    const activityLogPathDir = 'activitylog'
    const activityLogPathFile = FileUtils.join(activityLogPathDir, 'activitylog.json')

    const activityLog = await ActivityLogService.fetch({ user, surveyId, limit: 'ALL', orderBy: 'ASC' })
    archive.append(JSON.stringify(activityLog, null, 2), { name: activityLogPathFile })
  }
}
