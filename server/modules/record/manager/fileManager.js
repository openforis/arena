import { Objects, Promises } from '@openforis/arena-core'

import { ENV } from '@core/processUtils'
import * as RecordFile from '@core/record/recordFile'
import { db } from '@server/db/db'
import * as Log from '@server/log/log'

import * as FileRepository from '../repository/fileRepository'
import * as FileRepositoryFileSystem from '../repository/fileRepositoryFileSystem'
import * as FileRepositoryS3Bucket from '../repository/fileRepositoryS3Bucket'

const logger = Log.getLogger('FileManager')

export const fileContentStorageTypes = {
  db: 'db',
  fileSystem: 'fileSystem',
  s3Bucket: 's3Bucket',
}

export const getFileContentStorageType = () => {
  if (!Objects.isEmpty(ENV.fileStoragePath)) {
    return fileContentStorageTypes.fileSystem
  }
  if (!Objects.isEmpty(ENV.fileStorageAwsS3BucketName)) {
    return fileContentStorageTypes.s3Bucket
  }
  return fileContentStorageTypes.db
}

const contentFetchFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: async ({ surveyId, fileUuid }) =>
    FileRepositoryFileSystem.readFileContent({ surveyId, fileUuid }),
  [fileContentStorageTypes.s3Bucket]: async ({ surveyId, fileUuid }) =>
    FileRepositoryS3Bucket.readFileContent({ surveyId, fileUuid }),
}

const contentStoreFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: async ({ surveyId, fileUuid, content }) =>
    FileRepositoryFileSystem.writeFileContent({
      surveyId,
      fileUuid,
      content,
    }),
  [fileContentStorageTypes.s3Bucket]: async ({ surveyId, fileUuid, content }) =>
    FileRepositoryS3Bucket.uploadFileContent({ surveyId, fileUuid, content }),
}

const contentDeleteFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: async ({ surveyId, fileUuids }) =>
    FileRepositoryFileSystem.deleteFiles({ surveyId, fileUuids }),
  [fileContentStorageTypes.s3Bucket]: async ({ surveyId, fileUuids }) =>
    FileRepositoryS3Bucket.deleteFiles({ surveyId, fileUuids }),
}

const fetchFileContent = async ({ surveyId, file }) => {
  const storageType = getFileContentStorageType()
  const fetchFn = contentFetchFunctionByStorageType[storageType]
  if (fetchFn) {
    return fetchFn({ surveyId, fileUuid: RecordFile.getUuid(file) })
  }
  return RecordFile.getContent(file)
}

export const insertFile = async (surveyId, file, client = db) => {
  const storageType = getFileContentStorageType()
  const contentStoreFunction = contentStoreFunctionByStorageType[storageType]
  if (contentStoreFunction) {
    const fileUuid = RecordFile.getUuid(file)
    const content = RecordFile.getContent(file)
    await contentStoreFunction({ surveyId, fileUuid, content })
    // clear content in file object so it won't be stored into DB
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
  const storageType = getFileContentStorageType()
  const deleteFn = contentDeleteFunctionByStorageType[storageType]
  if (deleteFn) {
    const fileUuids = await FileRepository.fetchFileUuidsByRecordUuids({ surveyId, recordUuids }, client)
    await deleteFn({ surveyId, fileUuids })
  }
  await FileRepository.deleteFilesByRecordUuids(surveyId, recordUuids, client)
}

export const checkCanAccessFilesStorage = async () => {
  const storageType = getFileContentStorageType()
  switch (storageType) {
    case fileContentStorageTypes.fileSystem:
      await FileRepositoryFileSystem.checkCanAccessStorageFolder()
      return true
    case fileContentStorageTypes.s3Bucket:
      await FileRepositoryS3Bucket.checkCanAccessS3Bucket()
      return true
    default:
      return true
  }
}

export const moveFilesToNewStorageIfNecessary = async ({ surveyId }, client = db) => {
  const storageType = getFileContentStorageType()
  if (storageType === fileContentStorageTypes.db) {
    return false
  }

  const fileUuids = await FileRepository.fetchFileUuidsOfFilesWithContent({ surveyId }, client)
  if (fileUuids.length === 0) {
    return false
  }

  logger.debug(`Survey ${surveyId}: started moving ${fileUuids.length} files from DB to new storage (${storageType})`)

  await client.tx(async (tx) => {
    await Promises.each(fileUuids, async (fileUuid) => {
      const file = await FileRepository.fetchFileByUuid(surveyId, fileUuid, tx)

      const contentStoreFunction = contentStoreFunctionByStorageType[storageType]
      const content = RecordFile.getContent(file)
      await contentStoreFunction({ surveyId, fileUuid, content })
    })
    logger.debug(`Files moved from DB; clearing 'content' column in DB 'file' table`)
    await FileRepository.clearAllSurveyFilesContent({ surveyId }, tx)
  })

  logger.debug(
    `Survey ${surveyId}: ${fileUuids.length} survey files moved successfully to new storage (${storageType})`
  )

  return true
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
