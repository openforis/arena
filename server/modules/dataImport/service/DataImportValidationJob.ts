import DataImportJob from './DataImportJob/DataImportJob'

// dry run of the data import: the inner jobs do not persist anything (dryRun param)
export default class DataImportValidationJob extends DataImportJob {
  static readonly type: string = 'DataImportValidationJob'

  constructor(params?: any, type = DataImportValidationJob.type) {
    super(params, type)
  }
}
