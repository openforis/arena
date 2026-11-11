import { ArenaExportInfoFactory, ArenaExportType } from '@openforis/arena-core'

import { AppInfo } from '@core/app/appInfo'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { ExportFile } from '../exportFile'

export default class InfoExportJob extends Job {
  constructor(params) {
    super('InfoExportJob', params)
  }

  async execute() {
    const {
      archive,
      surveyId,
      user,
      exportType = ArenaExportType.survey,
      backup,
      includeResultAttributes,
      includeActivityLog,
    } = this.context
    // records only exports don't have the survey in context
    const survey = this.context.survey ?? (await SurveyManager.fetchSurveyById({ surveyId }, this.tx))

    const info = ArenaExportInfoFactory.createInstance({
      appInfo: AppInfo.currentAppInfo,
      dateExported: new Date().toISOString(),
      exportedByUserUuid: User.getUuid(user),
      exportType,
      options: {
        backup,
        includeActivityLog,
        includeData: backup || exportType === ArenaExportType.records,
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
