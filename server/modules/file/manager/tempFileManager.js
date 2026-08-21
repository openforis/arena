import { isUuid } from '@core/uuid'
import SystemError from '@core/systemError'

import { fileContentStorageTypes, getFileContentStorageType } from './fileManagerCommon'
import * as TempFileRepositoryFileSystem from '../repository/tempFileRepositoryFileSystem'
import * as TempFileRepositoryS3Bucket from '../repository/tempFileRepositoryS3Bucket'

export { fileContentStorageTypes, getFileContentStorageType } from './fileManagerCommon'

export const contentDeleteFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.deleteFile,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.deleteFile,
}

export const chunkWriteFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.writeChunkToTempFile,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.writeChunkToTempFile,
}

export const chunkMergeFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.mergeTempChunks,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.mergeTempChunks,
}

// `storageType` defaults to the real, current storage type on every call it's omitted - this
// param exists purely as a test seam (this repo's webpack-bundled unit tests can't jest.mock()
// local modules, so tests call this directly with an explicit storageType instead). Production
// code should never pass it explicitly.
export const getStorageFunctionOrThrow = ({
  functionByStorageType,
  operation,
  defaultFn = null,
  storageType = getFileContentStorageType(),
}) => {
  const tempFileStorageType =
    storageType === fileContentStorageTypes.db ? fileContentStorageTypes.fileSystem : storageType
  const fn = functionByStorageType[tempFileStorageType] ?? defaultFn
  if (!fn) {
    throw new Error(`Operation '${operation}' not implemented for storage type '${tempFileStorageType}'`)
  }
  return fn
}

export const deleteTempFile = async (fileNameOrPath) => {
  const deleteFn = getStorageFunctionOrThrow({
    functionByStorageType: contentDeleteFunctionByStorageType,
    operation: 'deleteTempFile',
  })
  await deleteFn({ fileNameOrPath })
}

export const writeChunkToTempFile = async ({ fileId, chunk, filePath = null, fileContent = null }) => {
  const writeChunkFunction = getStorageFunctionOrThrow({
    functionByStorageType: chunkWriteFunctionByStorageType,
    operation: 'writeChunkToTempFile',
  })
  await writeChunkFunction({ filePath, fileContent, fileId, chunk })
}

export const mergeTempChunks = async ({ fileId, totalChunks, onChunkMerged = null }) => {
  const mergeChunksFunction = getStorageFunctionOrThrow({
    functionByStorageType: chunkMergeFunctionByStorageType,
    operation: 'mergeTempChunks',
  })
  return mergeChunksFunction({ fileId, totalChunks, onChunkMerged })
}

export const keepFileFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.keepFileForLaterUse,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.keepFileForLaterUse,
}

export const getKeptFilePathFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.getKeptFilePath,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.getKeptFilePath,
}

const checkFileIdIsValid = (fileId) => {
  if (!isUuid(fileId)) {
    throw new Error(`Invalid file id: ${fileId}`)
  }
}

/**
 * Moves a previously merged temp file to storage that can be found again later using only its fileId,
 * so it can be reused by a later request instead of being uploaded again (e.g. confirming an import
 * after previewing it). Uses the configured storage type, so the later request can land on any dyno.
 * @param {!object} params - The params.
 * @param {!string} params.fileId - The uuid the file was originally uploaded with.
 * @param {!string} params.filePath - The current local path of the merged temp file.
 * @returns {Promise<void>} - Resolved once the file has been moved.
 */
export const keepFileForLaterUse = async ({ fileId, filePath }) => {
  checkFileIdIsValid(fileId)
  const keepFn = getStorageFunctionOrThrow({
    functionByStorageType: keepFileFunctionByStorageType,
    operation: 'keepFileForLaterUse',
  })
  await keepFn({ fileId, filePath })
}

/**
 * Resolves the local path of a file previously kept with keepFileForLaterUse, downloading it from
 * external storage into a fresh local temp file first if it isn't already on local disk.
 * Throws if the fileId is invalid or the file cannot be found anymore (e.g. it expired and got cleaned up).
 * @param {!object} params - The params.
 * @param {!string} params.fileId - The uuid the file was originally uploaded with.
 * @returns {Promise<string>} - The local path of the kept file.
 */
export const getKeptFilePath = async ({ fileId }) => {
  checkFileIdIsValid(fileId)
  const getFn = getStorageFunctionOrThrow({
    functionByStorageType: getKeptFilePathFunctionByStorageType,
    operation: 'getKeptFilePath',
  })
  const filePath = await getFn({ fileId })
  if (!filePath) {
    throw new SystemError('dataImport.pendingImportFileNotFoundOrExpired', { fileId })
  }
  return filePath
}

export const deletePendingImportFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.deletePendingImportFileIfAny,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.deletePendingImportFileIfAny,
}

/**
 * Deletes a file previously kept with keepFileForLaterUse, e.g. when the user cancels an import preview
 * without confirming the import. Does nothing if the file was already consumed, expired and cleaned up,
 * or never kept in the first place.
 * @param {!object} params - The params.
 * @param {!string} params.fileId - The uuid the file was originally uploaded with.
 * @returns {Promise<void>} - A promise resolved when the file has been deleted (or found to not exist).
 */
export const deletePendingImportFileIfAny = async ({ fileId }) => {
  checkFileIdIsValid(fileId)
  const deleteFn = getStorageFunctionOrThrow({
    functionByStorageType: deletePendingImportFunctionByStorageType,
    operation: 'deletePendingImportFileIfAny',
  })
  await deleteFn({ fileId })
}
