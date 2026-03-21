import { StreamUtils } from '@server/utils/streamUtils'

import * as FileUtils from '@server/utils/file/fileUtils'

import { fileContentStorageTypes, getFileContentStorageType, getStorageFunctionOrThrow } from './fileManagerCommon'
import * as TempFileRepositoryS3Bucket from '../repository/tempFileRepositoryS3Bucket'

export { fileContentStorageTypes, getFileContentStorageType }

const checkCanAccessStoreFunctionByStorageType = {
  [fileContentStorageTypes.db]: () => false,
  [fileContentStorageTypes.fileSystem]: () => false,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.checkCanAccessS3Bucket,
}

const contentAsStreamFetchFunctionByStorageType = {
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.getFileContentAsStream,
}

const contentStoreFunctionByStorageType = {
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.uploadFileContent,
}

const contentDeleteFunctionByStorageType = {
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.deleteFile,
}

export const checkCanAccessFilesStorage = async () => {
  const storageType = getFileContentStorageType()
  const checkStoreFunction = checkCanAccessStoreFunctionByStorageType[storageType]
  await checkStoreFunction?.()
}

export const insertTempFile = async ({ fileUuid, content }) => {
  const contentStoreFunction = getStorageFunctionOrThrow({
    functionByStorageType: contentStoreFunctionByStorageType,
    operation: 'insertTempFile',
  })
  await contentStoreFunction({ fileUuid, content })
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

const _getChunkFileName = ({ fileId, chunk }) => `${fileId}_part${chunk}`

export const writeChunkToTempFile = async ({ filePath = null, fileContent = null, fileId, chunk }) => {
  const destFileName = _getChunkFileName({ fileId, chunk })
  const destFilePath = FileUtils.tempFilePath(destFileName)
  if (filePath) {
    await FileUtils.copyFile(filePath, destFilePath)
  } else if (fileContent) {
    await FileUtils.writeFile(destFilePath, fileContent)
  } else {
    throw new Error('Missing file path or content')
  }
}

export const mergeTempChunks = async ({ fileId, totalChunks }) => {
  const finalFilePath = FileUtils.newTempFilePath()
  const writeStream = FileUtils.createWriteStream(finalFilePath)
  for (let chunk = 1; chunk <= totalChunks; chunk += 1) {
    // extract temporary chunk content
    const chunkFileName = _getChunkFileName({ fileId, chunk })
    const chunkFilePath = FileUtils.tempFilePath(chunkFileName)
    const chunkFileContent = await FileUtils.readBinaryFile(chunkFilePath)
    writeStream.write(chunkFileContent)
    // delete temporary chunk
    await FileUtils.deleteFileAsync(chunkFilePath)
  }
  writeStream.end()
  return finalFilePath
}
