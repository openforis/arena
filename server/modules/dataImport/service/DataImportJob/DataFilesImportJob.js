import FilesImportJob from '@server/modules/arenaImport/service/arenaImport/jobs/filesImportJob'

export default class DataFilesImportJob extends FilesImportJob {
  constructor(params) {
    super(params)
  }

  async fetchFilesSummaries() {
    const { updatedFilesByUuid } = this.context
    return Object.values(updatedFilesByUuid)
  }

  async fetchFileContent({ fileName, fileUuid }) {
    const { dataImportFileReader } = this.context
    return dataImportFileReader.getFile({ fileName, fileUuid })
  }
}
