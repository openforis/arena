import { Objects } from '@openforis/arena-core'

import * as ProcessUtils from '@core/processUtils'
import * as RecordFile from '@core/record/recordFile'
import { db } from '@server/db/db'

import * as FileRepository from '../repository/fileRepository'
import * as FileRepositoryFileSystem from '../repository/fileRepositoryFileSystem'

const fileContentStorageTypes = {
  db: 'db',
  fileSystem: 'fileSystem',
}

const determineFileContentStorageType = () => {
  if (!Objects.isEmpty(ProcessUtils.ENV.storageFilePath)) {
    return fileContentStorageTypes.fileSystem
  }
  return fileContentStorageTypes.db
}

const fetchFileContent = async ({ surveyId, file }) => {
  const fileContentStorageType = determineFileContentStorageType()
  if (fileContentStorageType === fileContentStorageTypes.fileSystem) {
    return FileRepositoryFileSystem.readFileContent({ surveyId, file })
  }
  return RecordFile.getContent(file)
}

export const insertFile = async (surveyId, file, client = db) => {
  const fileContentStorageType = determineFileContentStorageType()
  if (fileContentStorageType === fileContentStorageTypes.fileSystem) {
    await FileRepositoryFileSystem.writeFileContent({ surveyId, file })
    file.content = null
  }
  return FileRepository.insertFile(surveyId, file, client)
}

export const fetchFileByUuid = async (surveyId, fileUuid, client = db) => {
  const file = await FileRepository.fetchFileByUuid(surveyId, fileUuid, client)
  file.content = await fetchFileContent({ surveyId, file })
  return file
}

export const fetchFileByNodeUuid = async (surveyId, nodeUuid, client = db) => {
  const file = await FileRepository.fetchFileByNodeUuid(surveyId, nodeUuid, client)
  file.content = await fetchFileContent({ surveyId, file })
  return file
}

export const deleteFilesByRecordUuids = async (surveyId, recordUuids, client = db) => {
  const fileContentStorageType = determineFileContentStorageType()
  if (fileContentStorageType === fileContentStorageTypes.fileSystem) {
    const fileUuids = await FileRepository.fetchFileUuidsByRecordUuids({ surveyId, recordUuids }, client)
    await FileRepositoryFileSystem.deleteFiles({ surveyId, fileUuids })
  } else {
    await FileRepository.deleteFilesByRecordUuids(surveyId, recordUuids, client)
  }
}

export const {
  // READ
  fetchFileUuidsBySurveyId,
  fetchFileSummariesBySurveyId,
  fetchFileSummaryByUuid,
  // UPDATE
  markRecordFilesAsDeleted,
  updateFileProps,
  // DELETE
  deleteFileByUuid,
} = FileRepository
