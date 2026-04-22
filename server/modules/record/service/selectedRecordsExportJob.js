import RecordFilesExportJob from '@server/modules/survey/service/surveyExport/jobs/recordFilesExportJob'
import RecordsExportJob from '@server/modules/survey/service/surveyExport/jobs/recordsExportJob'
import ZipFileCreatorBaseJob from '@server/job/zipFileCreatorBaseJob'

export default class SelectedRecordsExportJob extends ZipFileCreatorBaseJob {
  constructor(params) {
    super(SelectedRecordsExportJob.type, params, [new RecordsExportJob(), new RecordFilesExportJob()])
  }
}

SelectedRecordsExportJob.type = 'SelectedRecordsExportJob'
