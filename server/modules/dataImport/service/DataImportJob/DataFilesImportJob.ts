import FilesImportJob from '@server/modules/arenaImport/service/arenaImport/jobs/filesImportJob'

export default class DataFilesImportJob extends FilesImportJob {
  constructor(params?: any) {
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
