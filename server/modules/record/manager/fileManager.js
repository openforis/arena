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

export const isFileContentStoredInDB = () => getFileContentStorageType() === fileContentStorageTypes.db

const checkCanAccessStoreFunctionByStorageType = {
  [fileContentStorageTypes.db]: () => true, // DB always accessible
  [fileContentStorageTypes.fileSystem]: FileRepositoryFileSystem.checkCanAccessStorageFolder,
  [fileContentStorageTypes.s3Bucket]: FileRepositoryS3Bucket.checkCanAccessS3Bucket,
}

const contentAsStreamFetchFunctionByStorageType = {
  [fileContentStorageTypes.db]: FileRepository.fetchFileContentAsStream,
  [fileContentStorageTypes.fileSystem]: FileRepositoryFileSystem.getFileContentAsStream,
  [fileContentStorageTypes.s3Bucket]: FileRepositoryS3Bucket.getFileContentAsStream,
}

const contentStoreFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: FileRepositoryFileSystem.writeFileContent,
  [fileContentStorageTypes.s3Bucket]: FileRepositoryS3Bucket.uploadFileContent,
}

const contentDeleteFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: FileRepositoryFileSystem.deleteFiles,
  [fileContentStorageTypes.s3Bucket]: FileRepositoryS3Bucket.deleteFiles,
}

export const fetchFileContentAsStream = async ({ surveyId, fileUuid }, client = db) => {
  const storageType = getFileContentStorageType()
  const fetchFn = contentAsStreamFetchFunctionByStorageType[storageType]
  if (fetchFn) {
    return fetchFn({ surveyId, fileUuid }, client)
  }
  return null
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

export const checkCanAccessFilesStorage = async () => {
  const storageType = getFileContentStorageType()
  const checkStoreFunction = checkCanAccessStoreFunctionByStorageType[storageType]
  await checkStoreFunction?.()
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
      const file = await FileRepository.fetchFileAndContentByUuid(surveyId, fileUuid, tx)

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

export const deleteFileByUuid = async ({ surveyId, fileUuid }, client = db) => {
  await FileRepository.deleteFileByUuid(surveyId, fileUuid, client)
  // do not delete content if not in DB: deletion out of transaction
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

export const deleteSurveyFilesContentByUuids = async ({ surveyId, fileUuids }) => {
  const storageType = getFileContentStorageType()
  const deleteFn = contentDeleteFunctionByStorageType[storageType]
  if (deleteFn) {
    await deleteFn({ surveyId, fileUuids })
  }
}

export const {
  // READ
  fetchFileSummariesBySurveyId,
  fetchFileSummaryByUuid,
  fetchFileUuidsBySurveyId,
  fetchTotalFilesSize,
  // UPDATE
  markRecordFilesAsDeleted,
  updateFileProps,
} = FileRepository
