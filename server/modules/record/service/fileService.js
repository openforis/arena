import * as FileManager from '../manager/fileManager'

export const {
  // CREATE
  insertFile,
  // READ
  fetchFilesBySurveyId,
  fetchFileByUuid,
  fetchFileByNodeUuid,
} = FileManager
