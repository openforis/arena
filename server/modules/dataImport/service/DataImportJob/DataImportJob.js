import Job from '@server/job/job'

import CsvDataImportJob from './CsvDataImportJob'
import DataFilesImportJob from './DataFilesImportJob'

const createInternalJobs = ({ includeFiles }) => [
  new CsvDataImportJob({ keepReaderOpenOnEnd: true }),
  ...(includeFiles ? [new DataFilesImportJob()] : []),
]

export default class DataImportJob extends Job {
  constructor(params, type = DataImportJob.type) {
    super(type, params, createInternalJobs(params))
  }

  generateResult() {
    // get result from csv data import job
    const csvDataImportJob = this.innerJobs[0]
    return csvDataImportJob?.result || {}
  }

  onEnd() {
    super.onEnd()
    const csvDataImportJob = this.innerJobs[0]
    csvDataImportJob?.dataImportFileReader?.close()
  }
}

DataImportJob.type = 'DataImportJob'
