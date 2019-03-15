const FileManager = require('../persistence/fileManager')

module.exports = {
  // CREATE
  insertFile: FileManager.insertFile,

  // READ
  fetchFileByUuid: FileManager.fetchFileByUuid,
  fetchFileByNodeUuid: FileManager.fetchFileByNodeUuid,
}