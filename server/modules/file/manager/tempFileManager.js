import { StreamUtils } from '@server/utils/streamUtils'

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
