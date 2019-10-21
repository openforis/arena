import FileManager from '../manager/fileManager';

export default {
  // CREATE
  insertFile: FileManager.insertFile,

  // READ
  fetchFileByUuid: FileManager.fetchFileByUuid,
  fetchFileByNodeUuid: FileManager.fetchFileByNodeUuid,
};
