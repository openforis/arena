import type { JobParams } from '@server/job/job'
import DataImportJob from './DataImportJob/DataImportJob'

// dry run of the data import: the inner jobs do not persist anything (dryRun param)
export default class DataImportValidationJob extends DataImportJob {
  static readonly type: string = 'DataImportValidationJob'

  constructor(params?: Partial<JobParams>, type = DataImportValidationJob.type) {
    super(params, type)
  }
}
