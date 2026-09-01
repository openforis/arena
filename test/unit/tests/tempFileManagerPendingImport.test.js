import {
  getStorageFunctionOrThrow,
  keepFileFunctionByStorageType,
  getKeptFilePathFunctionByStorageType,
  deletePendingImportFunctionByStorageType,
} from '../../../server/modules/file/manager/tempFileManager'
import { fileContentStorageTypes } from '../../../server/modules/file/manager/fileManagerCommon'
import * as TempFileRepositoryFileSystem from '../../../server/modules/file/repository/tempFileRepositoryFileSystem'
import * as TempFileRepositoryS3Bucket from '../../../server/modules/file/repository/tempFileRepositoryS3Bucket'

describe('TempFileManager pending import file storage routing', () => {
  test('keepFileForLaterUse routes to the S3 repository function when S3 storage is configured', () => {
    const fn = getStorageFunctionOrThrow({
      functionByStorageType: keepFileFunctionByStorageType,
      operation: 'keepFileForLaterUse',
      storageType: fileContentStorageTypes.s3Bucket,
    })
    expect(fn).toBe(TempFileRepositoryS3Bucket.keepFileForLaterUse)
  })

  test('getKeptFilePath routes to the S3 repository function when S3 storage is configured', () => {
    const fn = getStorageFunctionOrThrow({
      functionByStorageType: getKeptFilePathFunctionByStorageType,
      operation: 'getKeptFilePath',
      storageType: fileContentStorageTypes.s3Bucket,
    })
    expect(fn).toBe(TempFileRepositoryS3Bucket.getKeptFilePath)
  })

  test('keepFileForLaterUse and getKeptFilePath route to the file-system repository when file-system storage is configured', () => {
    const keepFn = getStorageFunctionOrThrow({
      functionByStorageType: keepFileFunctionByStorageType,
      operation: 'keepFileForLaterUse',
      storageType: fileContentStorageTypes.fileSystem,
    })
    const getFn = getStorageFunctionOrThrow({
      functionByStorageType: getKeptFilePathFunctionByStorageType,
      operation: 'getKeptFilePath',
      storageType: fileContentStorageTypes.fileSystem,
    })
    expect(keepFn).toBe(TempFileRepositoryFileSystem.keepFileForLaterUse)
    expect(getFn).toBe(TempFileRepositoryFileSystem.getKeptFilePath)
  })

  test('deletePendingImportFileIfAny routes to the S3 repository function when S3 storage is configured', () => {
    const fn = getStorageFunctionOrThrow({
      functionByStorageType: deletePendingImportFunctionByStorageType,
      operation: 'deletePendingImportFileIfAny',
      storageType: fileContentStorageTypes.s3Bucket,
    })
    expect(fn).toBe(TempFileRepositoryS3Bucket.deletePendingImportFileIfAny)
  })

  test('deletePendingImportFileIfAny routes to the file-system repository function when file-system storage is configured', () => {
    const fn = getStorageFunctionOrThrow({
      functionByStorageType: deletePendingImportFunctionByStorageType,
      operation: 'deletePendingImportFileIfAny',
      storageType: fileContentStorageTypes.fileSystem,
    })
    expect(fn).toBe(TempFileRepositoryFileSystem.deletePendingImportFileIfAny)
  })
})
