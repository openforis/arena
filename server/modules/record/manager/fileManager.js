import * as FileRepository from '../repository/fileRepository'

export const {
  // CREATE
  insertFile,
  // READ
  fetchFileUuidsBySurveyId,
  fetchFileByUuid,
  fetchFileByNodeUuid,
  // DELETE
  deleteFileByUuid,
  deleteFilesByRecordUuids,
} = FileRepository
