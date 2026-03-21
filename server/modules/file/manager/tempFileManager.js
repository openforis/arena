import { StreamUtils } from '@server/utils/streamUtils'

import { fileContentStorageTypes, getFileContentStorageType } from './fileManagerCommon'
import * as TempFileRepositoryFileSystem from '../repository/tempFileRepositoryFileSystem'
import * as TempFileRepositoryS3Bucket from '../repository/tempFileRepositoryS3Bucket'

export { fileContentStorageTypes, getFileContentStorageType }

const contentAsStreamFetchFunctionByStorageType = {
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.getFileContentAsStream,
}

const contentStoreFunctionByStorageType = {
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.uploadFileContent,
}

const contentStoreAsStreamFunctionByStorageType = {
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.uploadFileContentAsStream,
}

const contentDeleteFunctionByStorageType = {
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

export const insertTempFile = async ({ fileUuid, content }) => {
  const contentStoreFunction = getStorageFunctionOrThrow({
    functionByStorageType: contentStoreFunctionByStorageType,
    operation: 'insertTempFile',
  })
  await contentStoreFunction({ fileUuid, content })
}

export const insertTempFileAsStream = async ({ fileUuid, contentStream }) => {
  const contentStoreFunction = getStorageFunctionOrThrow({
    functionByStorageType: contentStoreAsStreamFunctionByStorageType,
    operation: 'insertTempFileAsStream',
  })
  await contentStoreFunction({ fileUuid, contentStream })
}

export const fetchTempFileContentAsStream = async ({ fileUuid }) => {
  const fetchFn = getStorageFunctionOrThrow({
    functionByStorageType: contentAsStreamFetchFunctionByStorageType,
    operation: 'fetchTempFileContentAsStream',
  })
  return fetchFn({ fileUuid })
}

export const fetchTempFileContentAsBuffer = async ({ fileUuid }) => {
  const contentStream = await fetchTempFileContentAsStream({ fileUuid })
  return StreamUtils.readStreamToBuffer(contentStream)
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
