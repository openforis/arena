import { db } from '@server/db/db'
import * as FileRepository from '../repository/fileRepository'
import * as NodeRepository from '../repository/nodeRepository'
import { getFileContentStorageType, fileContentStorageTypes } from '@server/modules/file/manager/fileManagerCommon'
import * as FileRepositoryFileSystem from '../repository/fileRepositoryFileSystem'
import * as FileRepositoryS3Bucket from '../repository/fileRepositoryS3Bucket'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'

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
    const files = await FileRepository.fetchFilesByRecordUuids({ surveyId, recordUuids }, client)
    if (files.length > 0) {
      await deleteFn({ surveyId, files })
    }
  }
  await FileRepository.deleteFilesByRecordUuids(surveyId, recordUuids, client)
}

/**
 * Hard-deletes the given files (storage content + DB rows).
 * Only meant to be used for preview records: soft-deleted files are never purged, so
 * preview records must have their replaced/removed files deleted immediately instead.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey ID.
 * @param {Array<{fileUuid: string, recordUuid: string}>} params.files - The files to delete.
 * @param {pgPromise.IDatabase} [client] - The database client.
 * @returns {Promise<void>} - The result promise.
 */
export const deleteFiles = async ({ surveyId, files }, client = db) => {
  if (files.length === 0) return
  const fileSummaries = files.map(({ fileUuid, recordUuid }) => ({ uuid: fileUuid, props: { recordUuid } }))
  await SurveyFileManager.deleteFilesAndContent({ surveyId, fileSummaries }, client)
}

/**
 * Hard-deletes a single file (storage content + DB row). Convenience wrapper around deleteFiles.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey ID.
 * @param {string} params.fileUuid - The UUID of the file to delete.
 * @param {string} params.recordUuid - The UUID of the record the file belongs to.
 * @param {pgPromise.IDatabase} [client] - The database client.
 * @returns {Promise<void>} - The result promise.
 */
export const deleteFileByUuid = async ({ surveyId, fileUuid, recordUuid }, client = db) =>
  deleteFiles({ surveyId, files: [{ fileUuid, recordUuid }] }, client)

/**
 * Hard-deletes the files (storage content + DB rows) associated with file-attribute nodes
 * belonging to the given node def UUIDs (or descendants of nodes belonging to them),
 * restricted to PREVIEW records (see NodeRepository.fetchFileValueNodesByNodeDefUuids).
 * Used only by deleteNodesByNodeDefUuids, whose delete is NOT scoped to a single in-memory
 * record (it can affect nodes across many records at once), so a DB query - rather than
 * filtering an in-memory record's nodes - is required for correctness.
 * Must be called BEFORE the corresponding node delete, since descendant node rows are removed
 * silently by the DB's ON DELETE CASCADE and can no longer be queried afterwards.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey ID.
 * @param {Array<string>} params.nodeDefUuids - Node def UUIDs being purged wholesale.
 * @param {pgPromise.IDatabase} [client] - The database client.
 * @returns {Promise<void>} - The result promise.
 */
export const deleteFilesByNodeDefUuids = async ({ surveyId, nodeDefUuids }, client = db) => {
  const fileNodes = await NodeRepository.fetchFileValueNodesByNodeDefUuids({ surveyId, nodeDefUuids }, client)
  await deleteFiles({ surveyId, files: fileNodes }, client)
}

export const {
  // UPDATE
  markRecordFilesAsDeleted,
} = FileRepository
