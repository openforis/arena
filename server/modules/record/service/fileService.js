import * as FileManager from '../manager/fileManager'

export const {
  // CREATE
  insertFile,
  // READ
  fetchFileUuidsBySurveyId,
  fetchFileByUuid,
  fetchFileByNodeUuid,
} = FileManager
