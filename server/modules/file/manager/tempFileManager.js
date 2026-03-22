import { fileContentStorageTypes, getFileContentStorageType } from './fileManagerCommon'
import * as TempFileRepositoryFileSystem from '../repository/tempFileRepositoryFileSystem'
import * as TempFileRepositoryS3Bucket from '../repository/tempFileRepositoryS3Bucket'

export { fileContentStorageTypes, getFileContentStorageType } from './fileManagerCommon'

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

export const deleteTempFile = async ({ fileUuid }) => {
  const deleteFn = getStorageFunctionOrThrow({
    functionByStorageType: contentDeleteFunctionByStorageType,
    operation: 'deleteTempFile',
  })
  await deleteFn({ fileUuid })
}

export const writeChunkToTempFile = async ({ filePath = null, fileContent = null, fileId, chunk }) => {
  const writeChunkFunction = getStorageFunctionOrThrow({
    functionByStorageType: chunkWriteFunctionByStorageType,
    operation: 'writeChunkToTempFile',
  })
  await writeChunkFunction({ filePath, fileContent, fileId, chunk })
}

export const mergeTempChunks = async ({ fileId, totalChunks }) => {
  const mergeChunksFunction = getStorageFunctionOrThrow({
    functionByStorageType: chunkMergeFunctionByStorageType,
    operation: 'mergeTempChunks',
  })
  return mergeChunksFunction({ fileId, totalChunks })
}
