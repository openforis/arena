import DataImportJob from './DataImportJob/DataImportJob'

export default class DataImportValidationJob extends DataImportJob {
  constructor(params, type = DataImportValidationJob.type) {
    super(params, type)
  }

  async persistUpdatedNodes({ nodesUpdated }) {
    // do nothing
  }
}

DataImportValidationJob.type = 'DataImportValidationJob'
