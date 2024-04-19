import FilesImportJob from '@server/modules/arenaImport/service/arenaImport/jobs/filesImportJob'

export default class DataFilesImportJob extends FilesImportJob {
  constructor(params) {
    super(params)
  }

  async fetchFilesSummaries() {}

  async fetchFileContent({ fileName, fileUuid }) {}
}
