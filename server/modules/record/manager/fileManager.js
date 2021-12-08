import * as FileRepository from '../repository/fileRepository'

export const {
  // CREATE
  insertFile,
  // READ
  fetchFileUuidsBySurveyId,
  fetchFileByUuid,
  fetchFileByNodeUuid,
  fetchFileSummariesBySurveyId,
  // DELETE
  deleteFileByUuid,
  deleteFilesByRecordUuids,
} = FileRepository
