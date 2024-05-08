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
    const result = super.combineInnerJobsResults()
    const { includeFiles } = this.context
    return {
      ...result,
      includeFiles,
    }
  }

  onEnd() {
    super.onEnd()

    this.errors = this.combineInnerJobsErrors()

    const csvDataImportJob = this.innerJobs[0]
    csvDataImportJob?.dataImportFileReader?.close()
  }
}

DataImportJob.type = 'DataImportJob'
