import {
  getStorageFunctionOrThrow,
  chunkWriteFunctionByStorageType,
  chunkMergeFunctionByStorageType,
} from '@server/modules/file/manager/tempFileManager'
import { fileContentStorageTypes } from '@server/modules/file/manager/fileManagerCommon'
import * as TempFileRepositoryFileSystem from '@server/modules/file/repository/tempFileRepositoryFileSystem'
import * as TempFileRepositoryS3Bucket from '@server/modules/file/repository/tempFileRepositoryS3Bucket'
import * as TempFileManager from '@server/modules/file/manager/tempFileManager'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as ProcessUtils from '@core/processUtils'

describe('TempFileManager storage routing', () => {
  test('routes to S3 functions when S3 storage is configured, regardless of file size', () => {
    const writeFn = getStorageFunctionOrThrow({
      functionByStorageType: chunkWriteFunctionByStorageType,
      operation: 'writeChunkToTempFile',
      storageType: fileContentStorageTypes.s3Bucket,
    })
    expect(writeFn).toBe(TempFileRepositoryS3Bucket.writeChunkToTempFile)

    const mergeFn = getStorageFunctionOrThrow({
      functionByStorageType: chunkMergeFunctionByStorageType,
      operation: 'mergeTempChunks',
      storageType: fileContentStorageTypes.s3Bucket,
    })
    expect(mergeFn).toBe(TempFileRepositoryS3Bucket.mergeTempChunks)
  })

  test('routes to file-system functions when file-system storage is configured', () => {
    const writeFn = getStorageFunctionOrThrow({
      functionByStorageType: chunkWriteFunctionByStorageType,
      operation: 'writeChunkToTempFile',
      storageType: fileContentStorageTypes.fileSystem,
    })
    expect(writeFn).toBe(TempFileRepositoryFileSystem.writeChunkToTempFile)

    const mergeFn = getStorageFunctionOrThrow({
      functionByStorageType: chunkMergeFunctionByStorageType,
      operation: 'mergeTempChunks',
      storageType: fileContentStorageTypes.fileSystem,
    })
    expect(mergeFn).toBe(TempFileRepositoryFileSystem.mergeTempChunks)
  })

  test('routes db storage type to file-system functions (temp chunks always need a real location)', () => {
    const writeFn = getStorageFunctionOrThrow({
      functionByStorageType: chunkWriteFunctionByStorageType,
      operation: 'writeChunkToTempFile',
      storageType: fileContentStorageTypes.db,
    })
    expect(writeFn).toBe(TempFileRepositoryFileSystem.writeChunkToTempFile)

    const mergeFn = getStorageFunctionOrThrow({
      functionByStorageType: chunkMergeFunctionByStorageType,
      operation: 'mergeTempChunks',
      storageType: fileContentStorageTypes.db,
    })
    expect(mergeFn).toBe(TempFileRepositoryFileSystem.mergeTempChunks)
  })

  test('writeChunkToTempFile and mergeTempChunks succeed for a "large" file with no size-based branching left', async () => {
    // No FILE_STORAGE_PATH/FILE_STORAGE_AWS_S3_BUCKET_NAME set in this environment, so
    // getFileContentStorageType() resolves to 'db', which getStorageFunctionOrThrow maps to
    // fileSystem for temp-chunk storage. These are the real, unmocked functions.
    // Passing a totalFileSize far above the old 10MB threshold proves there's no lingering
    // size-based branch that would route this elsewhere or fail.
    // The real server creates this folder on startup (see server/server.js); unit tests don't run
    // that startup path, so ensure it exists here too (this is the actual temp folder, not a mock).
    await FileUtils.mkdir(ProcessUtils.ENV.tempFolder)

    const fileId = 'test-file-no-size-branch'
    await TempFileManager.writeChunkToTempFile({
      fileId,
      chunk: 1,
      totalFileSize: 999999999999,
      fileContent: Buffer.from('test content'),
    })
    const mergedPath = await TempFileManager.mergeTempChunks({
      fileId,
      totalChunks: 1,
      totalFileSize: 999999999999,
    })
    expect(mergedPath).toBeTruthy()
    await TempFileManager.deleteTempFile(mergedPath)
  })
})
