import { ArenaExportInfoFactory } from '@openforis/arena-core'

import { AppInfo } from '@core/app/appInfo'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import Job from '@server/job/job'

import { ExportFile } from '../exportFile'

export default class InfoExportJob extends Job {
  constructor(params) {
    super('InfoExportJob', params)
  }

  async execute() {
    const { archive, survey, user, backup, includeResultAttributes, includeActivityLog } = this.context

    const info = ArenaExportInfoFactory.createInstance({
      appInfo: AppInfo.currentAppInfo,
      dateExported: new Date().toISOString(),
      exportedByUserUuid: User.getUuid(user),
      options: {
        backup,
        includeActivityLog,
        includeData: backup,
        includeResultAttributes,
      },
      survey: {
        uuid: Survey.getUuid(survey),
        name: Survey.getName(survey),
      },
    })

    archive.append(JSON.stringify(info, null, 2), { name: ExportFile.info })
  }
}
