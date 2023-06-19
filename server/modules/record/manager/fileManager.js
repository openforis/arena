import { Objects, Promises } from '@openforis/arena-core'

import * as ProcessUtils from '@core/processUtils'
import * as RecordFile from '@core/record/recordFile'
import { db } from '@server/db/db'
import * as Log from '@server/log/log'

import * as FileRepository from '../repository/fileRepository'
import * as FileRepositoryFileSystem from '../repository/fileRepositoryFileSystem'

const logger = Log.getLogger('FileManager')

export const fileContentStorageTypes = {
  db: 'db',
  fileSystem: 'fileSystem',
}

export const getFileContentStorageType = () => {
  if (!Objects.isEmpty(ProcessUtils.ENV.storageFilePath)) {
    return fileContentStorageTypes.fileSystem
  }
  return fileContentStorageTypes.db
}

const fetchFileContent = async ({ surveyId, file }) => {
  const fileContentStorageType = getFileContentStorageType()
  if (fileContentStorageType === fileContentStorageTypes.fileSystem) {
    return FileRepositoryFileSystem.readFileContent({ surveyId, file })
  }
  return RecordFile.getContent(file)
}

export const insertFile = async (surveyId, file, client = db) => {
  const fileContentStorageType = getFileContentStorageType()
  if (fileContentStorageType === fileContentStorageTypes.fileSystem) {
    await FileRepositoryFileSystem.writeFileContent({
      surveyId,
      fileUuid: RecordFile.getUuid(file),
      content: RecordFile.getContent(file),
    })
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
  const fileContentStorageType = getFileContentStorageType()
  if (fileContentStorageType === fileContentStorageTypes.fileSystem) {
    const fileUuids = await FileRepository.fetchFileUuidsByRecordUuids({ surveyId, recordUuids }, client)
    await FileRepositoryFileSystem.deleteFiles({ surveyId, fileUuids })
  } else {
    await FileRepository.deleteFilesByRecordUuids(surveyId, recordUuids, client)
  }
}

export const checkCanAccessFilesStorage = async () => {
  const storageType = getFileContentStorageType()
  if (storageType === fileContentStorageTypes.db) return true

  if (storageType === fileContentStorageTypes.fileSystem) {
    if (!(await FileRepositoryFileSystem.checkCanAccessStorageFolder())) {
      throw new Error('Cannot access files storage path: ' + FileRepositoryFileSystem.getStorageFolderPath())
    }
  }
  return true
}

export const moveFilesToNewStorageIfNecessary = async ({ surveyId }, client = db) => {
  const storageType = getFileContentStorageType()
  if (storageType === fileContentStorageTypes.db) return false

  const fileUuids = await FileRepository.fetchFileUuidsOfFilesWithContent({ surveyId }, client)
  if (fileUuids.length === 0) return false

  logger.debug(`Survey ${surveyId}: started moving ${fileUuids.length} files from DB to new storage (${storageType})`)

  if (storageType === fileContentStorageTypes.fileSystem) {
    return client.tx(async (tx) => {
      await Promises.each(fileUuids, async (fileUuid) => {
        const file = await FileRepository.fetchFileByUuid(surveyId, fileUuid, tx)

        await FileRepositoryFileSystem.writeFileContent({
          surveyId,
          fileUuid: RecordFile.getUuid(file),
          content: RecordFile.getContent(file),
        })
      })
      logger.debug(`Files moved from DB; clearing 'content' column`)
      await FileRepository.clearAllSurveyFilesContent({ surveyId }, tx)

      return true
    })
  }

  logger.debug(
    `Survey ${surveyId}: ${fileUuids.length} survey files moved successfully to new storage (${storageType})`
  )

  return false
}

export const {
  // READ
  fetchFileSummariesBySurveyId,
  fetchFileSummaryByUuid,
  // UPDATE
  markRecordFilesAsDeleted,
  updateFileProps,
  // DELETE
  deleteFileByUuid,
} = FileRepository
