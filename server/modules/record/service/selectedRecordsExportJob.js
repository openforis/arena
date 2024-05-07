import FilesExportJob from '@server/modules/survey/service/surveyExport/jobs/filesExportJob'
import RecordsExportJob from '@server/modules/survey/service/surveyExport/jobs/recordsExportJob'
import ZipFileCreatorBaseJob from '@server/job/zipFileCreatorBaseJob'

export default class SelectedRecordsExportJob extends ZipFileCreatorBaseJob {
  constructor(params) {
    super(SelectedRecordsExportJob.type, params, [new RecordsExportJob(), new FilesExportJob()])
  }
}

SelectedRecordsExportJob.type = 'SelectedRecordsExportJob'
