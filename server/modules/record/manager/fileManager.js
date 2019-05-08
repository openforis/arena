const FileRepository = require('../repository/fileRepository')

module.exports = {
  //CREATE
  insertFile: FileRepository.insertFile,

  //READ
  fetchFileByUuid: FileRepository.fetchFileByUuid,
  fetchFileByNodeUuid: FileRepository.fetchFileByNodeUuid,

  //DELETE
  deleteFileByUuid: FileRepository.deleteFileByUuid,
  deleteFilesByRecordUuids: FileRepository.deleteFilesByRecordUuids
}