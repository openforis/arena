import { db, DbClient } from '@server/db/db'
import { fileContentStorageTypes, getFileContentStorageType } from '@server/modules/file/manager/fileManagerCommon'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'
import * as FileRepository from '../repository/fileRepository'
import * as FileRepositoryFileSystem from '../repository/fileRepositoryFileSystem'
import * as FileRepositoryS3Bucket from '../repository/fileRepositoryS3Bucket'
import * as NodeRepository from '../repository/nodeRepository'

const contentDeleteFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: FileRepositoryFileSystem.deleteFiles,
  [fileContentStorageTypes.s3Bucket]: FileRepositoryS3Bucket.deleteFiles,
}

/**
 * Deletes all files associated with the given record UUIDs (record-level operation).
 */
export const deleteFilesByRecordUuids = async (surveyId: number, recordUuids: string[], client: DbClient = db) => {
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
 * @param {Array<{fileUuid: string, recordUuid: string}>} params.files - The files to delete.
 */
export const deleteFiles = async (
  { surveyId, files }: { surveyId: number; files: { fileUuid: string; recordUuid?: string | null }[] },
  client: DbClient = db
) => {
  if (files.length === 0) return
  const fileSummaries = files.map(({ fileUuid, recordUuid }) => ({ uuid: fileUuid, props: { recordUuid } }))
  await SurveyFileManager.deleteFilesAndContent({ surveyId, fileSummaries }, client)
}

/**
 * Hard-deletes a single file (storage content + DB row). Convenience wrapper around deleteFiles.
 * @param {object} params - The parameters.
 * @param {string} params.fileUuid - The UUID of the file to delete.
 * @param {string} params.recordUuid - The UUID of the record the file belongs to.
 */
export const deleteFileByUuid = (
  { surveyId, fileUuid, recordUuid }: { surveyId: number; fileUuid: string; recordUuid: string },
  client: DbClient = db
) => deleteFiles({ surveyId, files: [{ fileUuid, recordUuid }] }, client)

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
 * @param {Array<string>} params.nodeDefUuids - Node def UUIDs being purged wholesale.
 */
export const deleteFilesByNodeDefUuids = async (
  { surveyId, nodeDefUuids }: { surveyId: number; nodeDefUuids: string[] },
  client: DbClient = db
) => {
  const fileNodes = await NodeRepository.fetchFileValueNodesByNodeDefUuids({ surveyId, nodeDefUuids }, client)
  await deleteFiles({ surveyId, files: fileNodes }, client)
}

export const {
  // READ
  fetchNonDeletedFileUuidsByRecordUuids,
  // UPDATE
  markRecordFilesAsDeleted,
} = FileRepository
