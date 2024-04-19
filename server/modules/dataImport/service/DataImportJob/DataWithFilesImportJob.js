import Job from '@server/job/job'

import DataImportJob from './DataImportJob'
import DataFilesImportJob from './DataFilesImportJob'

const createInternalJobs = ({ includeFiles }) => [
  new DataImportJob(),
  ...(includeFiles ? [new DataFilesImportJob()] : []),
]

export default class DataImportWithFilesJob extends Job {
  constructor(params) {
    super(DataImportWithFilesJob.type, params, createInternalJobs(params))
  }
}

DataImportWithFilesJob.type = 'DataImportWithFilesJob'
