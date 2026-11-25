import type { JobParams } from '@server/job/job'
import FilesImportJob from '@server/modules/arenaImport/service/arenaImport/jobs/filesImportJob'

export default class DataFilesImportJob extends FilesImportJob {
  constructor(params?: Partial<JobParams>) {
    super(params)
  }

  fetchFilesSummaries() {
    const { updatedFilesByUuid } = this.context
    return Promise.resolve(Object.values(updatedFilesByUuid))
  }

  fetchFileContent({ fileName, fileUuid }) {
    const { dataImportFileReader } = this.context
    return dataImportFileReader.getFile({ fileName, fileUuid })
  }
}
