import { isUuid } from '@core/uuid'
import SystemError from '@core/systemError'
import * as FileUtils from '@server/utils/file/fileUtils'

import { fileContentStorageTypes, getFileContentStorageType } from './fileManagerCommon'
import * as TempFileRepositoryFileSystem from '../repository/tempFileRepositoryFileSystem'
import * as TempFileRepositoryS3Bucket from '../repository/tempFileRepositoryS3Bucket'

export { fileContentStorageTypes, getFileContentStorageType } from './fileManagerCommon'

const minFileSizeToUseAlternativeStorage = 10 * 1024 * 1024 // 10MB - For files larger than this, use the configured storage type (e.g. S3 bucket) instead of file system storage.

const contentDeleteFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.deleteFile,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.deleteFile,
}

const chunkWriteFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.writeChunkToTempFile,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.writeChunkToTempFile,
}

const chunkMergeFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.mergeTempChunks,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.mergeTempChunks,
}

const getStorageFunctionOrThrow = ({ functionByStorageType, operation, defaultFn = null }) => {
  const fileStorageType = getFileContentStorageType()
  const tempFileStorageType =
    fileStorageType === fileContentStorageTypes.db ? fileContentStorageTypes.fileSystem : fileStorageType
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

export const writeChunkToTempFile = async ({ fileId, chunk, totalFileSize, filePath = null, fileContent = null }) => {
  let writeChunkFunction
  if (totalFileSize > minFileSizeToUseAlternativeStorage) {
    // For larger files, use the configured storage type (e.g. S3 bucket) to write chunks.
    writeChunkFunction = getStorageFunctionOrThrow({
      functionByStorageType: chunkWriteFunctionByStorageType,
      operation: 'writeChunkToTempFile',
    })
  } else {
    // For smaller files, default to file system storage to avoid overhead of alternative storage types.
    writeChunkFunction = chunkWriteFunctionByStorageType[fileContentStorageTypes.fileSystem]
  }
  await writeChunkFunction({ filePath, fileContent, fileId, chunk })
}

export const mergeTempChunks = async ({ fileId, totalChunks, totalFileSize, onChunkMerged = null }) => {
  let mergeChunksFunction
  if (totalFileSize > minFileSizeToUseAlternativeStorage) {
    // For larger files, use the configured storage type (e.g. S3 bucket) to merge chunks.
    mergeChunksFunction = getStorageFunctionOrThrow({
      functionByStorageType: chunkMergeFunctionByStorageType,
      operation: 'mergeTempChunks',
    })
  } else {
    // For smaller files, default to file system storage to merge chunks.
    mergeChunksFunction = chunkMergeFunctionByStorageType[fileContentStorageTypes.fileSystem]
  }
  return mergeChunksFunction({ fileId, totalChunks, onChunkMerged })
}

// Whatever the chunk storage type, mergeTempChunks always produces its final merged file on the local
// file system (see tempFileRepositoryFileSystem/tempFileRepositoryS3Bucket implementations), so these
// two functions only need to deal with local files.

const pendingImportFilePrefix = 'pendingImport_'
const getPendingImportFileName = (fileId) => `${pendingImportFilePrefix}${fileId}`

const checkFileIdIsValid = (fileId) => {
  if (!isUuid(fileId)) {
    throw new Error(`Invalid file id: ${fileId}`)
  }
}

/**
 * Moves a previously merged temp file to a location that can be found again later using only its fileId,
 * so it can be reused by a later request instead of being uploaded again (e.g. confirming an import after
 * previewing it). The file keeps living in the temp folder, so it's still covered by the periodic temp
 * files cleanup.
 * @param {!object} params - The params.
 * @param {!string} params.fileId - The uuid the file was originally uploaded with.
 * @param {!string} params.filePath - The current path of the merged temp file.
 * @returns {Promise<string>} - The new path of the file.
 */
export const keepFileForLaterUse = async ({ fileId, filePath }) => {
  checkFileIdIsValid(fileId)
  const destPath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  await FileUtils.renameFile(filePath, destPath)
  return destPath
}

/**
 * Resolves the path of a file previously kept with keepFileForLaterUse.
 * Throws if the fileId is invalid or the file cannot be found anymore (e.g. it expired and got cleaned up).
 * @param {!object} params - The params.
 * @param {!string} params.fileId - The uuid the file was originally uploaded with.
 * @returns {string} - The path of the kept file.
 */
export const getKeptFilePath = ({ fileId }) => {
  checkFileIdIsValid(fileId)
  const filePath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  if (!FileUtils.exists(filePath)) {
    throw new SystemError('dataImport.pendingImportFileNotFoundOrExpired', { fileId })
  }
  return filePath
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
  const filePath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  if (FileUtils.exists(filePath)) {
    await FileUtils.deleteFileAsync(filePath)
  }
}
