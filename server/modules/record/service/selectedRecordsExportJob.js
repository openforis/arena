import InfoExportJob, { exportTypes } from '@server/modules/survey/service/surveyExport/jobs/infoExportJob'
import RecordFilesExportJob from '@server/modules/survey/service/surveyExport/jobs/recordFilesExportJob'
import RecordsExportJob from '@server/modules/survey/service/surveyExport/jobs/recordsExportJob'
import * as User from '@core/user/user'

import ZipFileCreatorBaseJob from '@server/job/zipFileCreatorBaseJob'
import { DownloadAuthTokenUtils } from '@server/utils/downloadAuthTokenUtils'

export default class SelectedRecordsExportJob extends ZipFileCreatorBaseJob {
  constructor(params) {
    super(SelectedRecordsExportJob.type, { ...params, exportType: exportTypes.records }, [
      new RecordsExportJob(),
      new RecordFilesExportJob(),
      new InfoExportJob(),
    ])
  }

  generateResult() {
    const result = super.generateResult()
    // lets Arena web download the file with a direct GET (not buffered in memory)
    const { user, outputFileName } = this.context
    const { token: downloadToken } = DownloadAuthTokenUtils.generateToken({
      userUuid: User.getUuid(user),
      fileName: outputFileName,
    })
    return { ...result, downloadToken }
  }
}

SelectedRecordsExportJob.type = 'SelectedRecordsExportJob'
