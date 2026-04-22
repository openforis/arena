import { NumberConversionUtils } from '@core/numberConversionUtils'
import * as SurveyFile from '@core/survey/surveyFile'

import { db } from '@server/db/db'
import * as Log from '@server/log/log'

import { fileContentStorageTypes, getFileContentStorageType } from '@server/modules/file/manager/fileManagerCommon'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import { StreamUtils } from '@server/utils/streamUtils'

import * as FileRepository from '../../record/repository/fileRepository'
import * as FileRepositoryFileSystem from '../../record/repository/fileRepositoryFileSystem'
import * as FileRepositoryS3Bucket from '../../record/repository/fileRepositoryS3Bucket'

export { fileContentStorageTypes, getFileContentStorageType } from '@server/modules/file/manager/fileManagerCommon'

const logger = Log.getLogger('SurveyFileManager')

export const defaultSurveyFilesTotalSpaceMB = 10 * 1024 // in MB (=10 GB)
export const maxSurveyFilesTotalSpaceMB = 100 * 1024 // in MB (=100 GB)

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

export const fetchFileContentAsBuffer = async ({ surveyId, fileUuid }, client = db) => {
  const contentStream = await fetchFileContentAsStream({ surveyId, fileUuid }, client)
  return StreamUtils.readStreamToBuffer(contentStream)
}

export const fetchSurveyFilesTotalSpace = async ({ surveyId }) => {
  const surveyTotalSpaceMB = await SurveyRepository.fetchFilesTotalSpace(surveyId)
  const totalSpaceMB = surveyTotalSpaceMB ?? defaultSurveyFilesTotalSpaceMB
  return NumberConversionUtils.dataStorageValueToBytes(NumberConversionUtils.dataStorageUnits.MB)(totalSpaceMB)
}

export const insertFile = async (surveyId, file, client = db) => {
  const storageType = getFileContentStorageType()
  const contentStoreFunction = contentStoreFunctionByStorageType[storageType]
  if (contentStoreFunction) {
    const fileUuid = SurveyFile.getUuid(file)
    const content = SurveyFile.getContent(file)
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
    for (const fileUuid of fileUuids) {
      const file = await FileRepository.fetchFileAndContentByUuid(surveyId, fileUuid, tx)

      const contentStoreFunction = contentStoreFunctionByStorageType[storageType]
      const content = SurveyFile.getContent(file)
      await contentStoreFunction({ surveyId, fileUuid, content })
    }
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

export const deleteFilesContentByUuids = async ({ surveyId, fileUuids }) => {
  const storageType = getFileContentStorageType()
  const deleteFn = contentDeleteFunctionByStorageType[storageType]
  if (deleteFn) {
    await deleteFn({ surveyId, fileUuids })
  }
}

export const deleteFilesAndContentByUuids = async ({ surveyId, fileUuids }, client = db) => {
  await deleteFilesContentByUuids({ surveyId, fileUuids })
  await FileRepository.deleteFilesByUuids(surveyId, fileUuids, client)
}

export const deleteTemporaryFiles = async (surveyId, client = db) => {
  const fileSummaries = await FileRepository.fetchFileSummariesBySurveyId(surveyId, client)
  const temporaryFileUuids = []
  for (const fileSummary of fileSummaries) {
    const fileUuid = SurveyFile.getUuid(fileSummary)
    if (SurveyFile.isTemporary(fileSummary)) {
      temporaryFileUuids.push(fileUuid)
    }
  }
  if (temporaryFileUuids.length > 0) {
    logger.debug(`Deleting ${temporaryFileUuids.length} temporary files of survey ${surveyId}`)
    await deleteFilesAndContentByUuids({ surveyId, fileUuids: temporaryFileUuids }, client)
  }
}

export const {
  // READ
  fetchFileSummariesBySurveyId,
  fetchFileSummaryByUuid,
  fetchFileUuidsBySurveyId,
  fetchCountAndTotalFilesSize,
  // UPDATE
  updateFileProps,
  clearFileTemporaryFlag,
  cleanupSurveyFilesProps,
} = FileRepository
