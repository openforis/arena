import FileRepository from '../repository/fileRepository';

export default {
  //CREATE
  insertFile: FileRepository.insertFile,

  //READ
  fetchFileByUuid: FileRepository.fetchFileByUuid,
  fetchFileByNodeUuid: FileRepository.fetchFileByNodeUuid,

  //DELETE
  deleteFileByUuid: FileRepository.deleteFileByUuid,
  deleteFilesByRecordUuids: FileRepository.deleteFilesByRecordUuids
};
