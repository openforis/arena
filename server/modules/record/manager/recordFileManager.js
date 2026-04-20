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
