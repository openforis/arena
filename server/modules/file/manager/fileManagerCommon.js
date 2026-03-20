import { Objects } from '@openforis/arena-core'

import { ENV } from '@core/processUtils'

export const fileContentStorageTypes = { db: 'db', fileSystem: 'fileSystem', s3Bucket: 's3Bucket' }

export const getFileContentStorageType = () => {
  if (!Objects.isEmpty(ENV.fileStoragePath)) {
    return fileContentStorageTypes.fileSystem
  }
  if (!Objects.isEmpty(ENV.fileStorageAwsS3BucketName)) {
    return fileContentStorageTypes.s3Bucket
  }
  return fileContentStorageTypes.db
}

export const getStorageFunctionOrThrow = ({ functionByStorageType, operation }) => {
  const storageType = getFileContentStorageType()
  const fn = functionByStorageType[storageType]
  if (!fn) {
    throw new Error(`Operation '${operation}' not implemented for storage type '${storageType}'`)
  }
  return fn
}
