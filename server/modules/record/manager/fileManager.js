import * as FileRepository from '../repository/fileRepository'

export const {
  // CREATE
  insertFile,
  // READ
  fetchFilesBySurveyId,
  fetchFileByUuid,
  fetchFileByNodeUuid,
  // DELETE
  deleteFileByUuid,
  deleteFilesByRecordUuids,
} = FileRepository
