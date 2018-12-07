const FileRepository = require('./fileRepository')

module.exports = {
  //CREATE
  insertFile: FileRepository.insertFile,

  //READ
  fetchFileByUuid: FileRepository.fetchFileByUuid,
}