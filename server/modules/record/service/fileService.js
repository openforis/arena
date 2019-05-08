const FileManager = require('../manager/fileManager')

module.exports = {
  // CREATE
  insertFile: FileManager.insertFile,

  // READ
  fetchFileByUuid: FileManager.fetchFileByUuid,
  fetchFileByNodeUuid: FileManager.fetchFileByNodeUuid,
}