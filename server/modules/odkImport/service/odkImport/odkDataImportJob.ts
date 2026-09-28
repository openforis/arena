import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import PrepareImportFileJob from '@server/modules/file/service/prepareImportFileJob'
import RecordCheckJob from '@server/modules/survey/service/recordCheckJob'

import OdkSubmissionReaderJob from './dataImportJobs/odkSubmissionReaderJob'
import RecordsImportJob from './dataImportJobs/recordsImportJob'

// Phase 2 scope: imports an ODK Briefcase-style submissions export (zip) into an existing survey's
// records. No preview/summary job yet (deferred - see the Phase 2 plan doc); reuses the existing
// RecordCheckJob post-import consistency pass, same as collectImport's data-only import chain.
const createInnerJobs = () => [
  new PrepareImportFileJob(),
  new OdkSubmissionReaderJob(),
  new RecordsImportJob(),
  new RecordCheckJob(),
]

export default class OdkDataImportJob extends Job {
  static readonly type = 'OdkDataImportJob'

  constructor(params?: any) {
    super(OdkDataImportJob.type, params, createInnerJobs())
  }

  async beforeSuccess() {
    const context: any = this.context
    this.setResult({ submittedCount: context.submittedCount, skippedCount: context.skippedCount } as any)
  }

  async onEnd() {
    await super.onEnd()
    const context: any = this.context
    if (context.filePath) {
      await FileUtils.deleteFileAsync(context.filePath)
    }
  }
}
