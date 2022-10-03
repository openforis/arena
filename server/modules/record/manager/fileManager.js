import * as FileRepository from '../repository/fileRepository'

export const {
  // CREATE
  insertFile,
  // READ
  fetchFileUuidsBySurveyId,
  fetchFileByUuid,
  fetchFileByNodeUuid,
  fetchFileSummariesBySurveyId,
  fetchFileSummaryByUuid,
  // UPDATE
  updateFileProps,
  // DELETE
  deleteFileByUuid,
  deleteFilesByRecordUuids,
} = FileRepository
