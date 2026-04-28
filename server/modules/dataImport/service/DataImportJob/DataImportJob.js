import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import PrepareImportFileJob from '@server/modules/file/service/prepareImportFileJob'

import FlatDataImportJob from './FlatDataImportJob'
import DataFilesImportJob from './DataFilesImportJob'
import EntitiesDeleteJob from './EntitiesDeleteJob'

const createInternalJobs = ({ includeFiles, deleteExistingEntities }) => [
  new PrepareImportFileJob(),
  new FlatDataImportJob({ keepReaderOpenOnEnd: true }),
  ...(includeFiles ? [new DataFilesImportJob()] : []),
  ...(deleteExistingEntities ? [new EntitiesDeleteJob()] : []),
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
      entitiesDeleted: result.entitiesDeleted || 0,
      includeFiles,
    }
  }

  async onEnd() {
    await super.onEnd()

    this.errors = this.combineInnerJobsErrors()

    const flatDataImportJobInner = this.innerJobs[1]
    flatDataImportJobInner?.dataImportFileReader?.close()

    const { filePath } = this.context
    if (filePath) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }
}

DataImportJob.type = 'DataImportJob'
