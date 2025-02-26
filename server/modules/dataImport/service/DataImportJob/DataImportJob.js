import Job from '@server/job/job'

import FlatDataImportJob from './FlatDataImportJob'
import DataFilesImportJob from './DataFilesImportJob'

const createInternalJobs = ({ includeFiles }) => [
  new FlatDataImportJob({ keepReaderOpenOnEnd: true }),
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

    const flatDataImportJob = this.innerJobs[0]
    flatDataImportJob?.dataImportFileReader?.close()
  }
}

DataImportJob.type = 'DataImportJob'
