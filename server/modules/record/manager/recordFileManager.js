import { db } from '@server/db/db'
import * as FileRepository from '../repository/fileRepository'
import { getFileContentStorageType, fileContentStorageTypes } from '@server/modules/file/manager/fileManagerCommon'
import * as FileRepositoryFileSystem from '../repository/fileRepositoryFileSystem'
import * as FileRepositoryS3Bucket from '../repository/fileRepositoryS3Bucket'

const contentDeleteFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: FileRepositoryFileSystem.deleteFiles,
  [fileContentStorageTypes.s3Bucket]: FileRepositoryS3Bucket.deleteFiles,
}

/**
 * Deletes a file by its UUID (record-level operation).
 * @param root0
 * @param root0.surveyId
 * @param root0.fileUuid
 * @param client
 */
export const deleteFileByUuid = async ({ surveyId, fileUuid }, client = db) => {
  await FileRepository.deleteFileByUuid(surveyId, fileUuid, client)
  // do not delete content if not in DB: deletion out of transaction
}

/**
 * Deletes all files associated with the given record UUIDs (record-level operation).
 * @param surveyId
 * @param recordUuids
 * @param client
 */
export const deleteFilesByRecordUuids = async (surveyId, recordUuids, client = db) => {
  const storageType = getFileContentStorageType()
  const deleteFn = contentDeleteFunctionByStorageType[storageType]
  if (deleteFn) {
    const fileUuids = await FileRepository.fetchFileUuidsByRecordUuids({ surveyId, recordUuids }, client)
    await deleteFn({ surveyId, fileUuids })
  }
  await FileRepository.deleteFilesByRecordUuids(surveyId, recordUuids, client)
}

export const {
  // UPDATE
  markRecordFilesAsDeleted,
  // DELETE
  deleteFilesByUuids,
} = FileRepository
