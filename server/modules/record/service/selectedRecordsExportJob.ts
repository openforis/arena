import { ArenaExportType } from '@openforis/arena-core'

import * as User from '@core/user/user'
import type { JobParams } from '@server/job/job'
import ZipFileCreatorBaseJob from '@server/job/zipFileCreatorBaseJob'
import InfoExportJob from '@server/modules/survey/service/surveyExport/jobs/infoExportJob'
import RecordFilesExportJob from '@server/modules/survey/service/surveyExport/jobs/recordFilesExportJob'
import RecordsExportJob from '@server/modules/survey/service/surveyExport/jobs/recordsExportJob'
import { DownloadAuthTokenUtils } from '@server/utils/downloadAuthTokenUtils'

export default class SelectedRecordsExportJob extends ZipFileCreatorBaseJob {
  static readonly type: string = 'SelectedRecordsExportJob'

  constructor(params?: Partial<JobParams>) {
    super(SelectedRecordsExportJob.type, { ...params, exportType: ArenaExportType.records }, [
      new RecordsExportJob(),
      new RecordFilesExportJob(),
      new InfoExportJob(),
    ])
  }

  async generateResult() {
    const result = await super.generateResult()
    // lets Arena web download the file with a direct GET (not buffered in memory)
    const { user, outputFileName } = this.context
    const { token: downloadToken } = DownloadAuthTokenUtils.generateToken({
      userUuid: User.getUuid(user),
      fileName: outputFileName,
    })
    return { ...result, downloadToken }
  }
}
