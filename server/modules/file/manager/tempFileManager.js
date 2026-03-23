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

export const writeChunkToTempFile = async ({
  fileId,
  chunk,
  filePath = null,
  fileContent = null,
  totalFileSize = undefined,
}) => {
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

export const mergeTempChunks = async ({ fileId, totalChunks, totalFileSize }) => {
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
  return mergeChunksFunction({ fileId, totalChunks })
}
