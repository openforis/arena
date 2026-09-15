import { PassThrough } from 'node:stream'

import * as FileUtils from '@server/utils/file/fileUtils'
import { endWriteStream, writeReadableToWritable } from '@server/utils/ioUtils'

import { createS3BucketRepository } from './fileRepositoryS3BucketCommon'
import { getChunkFileName } from '../tempFileUtils'

export { checkCanAccessS3Bucket } from './fileRepositoryS3BucketCommon'

const tempPrefix = 'temp/'

const getTempFileKey = ({ fileUuid }) => `${tempPrefix}${fileUuid}`

const {
  uploadFileContent,
  uploadFileContentAsStream,
  getFileContentAsStream,
  getFileSize,
  deleteFile: deleteFileCommon,
  listFiles,
} = createS3BucketRepository({
  getFileKey: getTempFileKey,
})

export const deleteFile = async ({ fileNameOrPath }) => deleteFileCommon({ fileUuid: fileNameOrPath })

export const writeChunkToTempFile = async ({ filePath = null, fileContent = null, fileId, chunk }) => {
  const fileUuid = getChunkFileName({ fileId, chunk })
  if (filePath) {
    const contentStream = FileUtils.createReadStream(filePath)
    const contentLength = FileUtils.getFileSize(filePath)
    await uploadFileContentAsStream({ fileUuid, contentStream, contentLength })
  } else if (fileContent) {
    await uploadFileContent({ fileUuid, content: fileContent })
  } else {
    throw new TypeError('Missing file path or content')
  }
}

const calculateTotalChunksSize = async ({ totalChunks, fileId }) => {
  let totalContentLength = 0
  for (let chunk = 1; chunk <= totalChunks; chunk += 1) {
    const chunkFileName = getChunkFileName({ fileId, chunk })
    const chunkSize = await getFileSize({ fileUuid: chunkFileName })
    if (!Number.isFinite(chunkSize)) {
      throw new TypeError(`Cannot determine size of temp chunk ${chunkFileName}`)
    }
    totalContentLength += chunkSize
  }
  return totalContentLength
}

export const mergeTempChunksToS3 = async ({ fileId, totalChunks }) => {
  const totalContentLength = await calculateTotalChunksSize({ fileId, totalChunks })

  const finalFileName = FileUtils.newTempFileName()
  const uploadStream = new PassThrough()
  const uploadPromise = uploadFileContentAsStream({
    fileUuid: finalFileName,
    contentStream: uploadStream,
    contentLength: totalContentLength,
  })

  try {
    for (let chunk = 1; chunk <= totalChunks; chunk += 1) {
      // extract temporary chunk content
      const chunkFileName = getChunkFileName({ fileId, chunk })
      const chunkFileStream = await getFileContentAsStream({ fileUuid: chunkFileName })
      await writeReadableToWritable({ readStream: chunkFileStream, writeStream: uploadStream })
      // delete temporary chunk
      await deleteFile({ fileNameOrPath: chunkFileName })
    }

    uploadStream.end()
    await uploadPromise

    return finalFileName
  } catch (error) {
    uploadStream.destroy(error)
    await uploadPromise.catch(() => null)
    await deleteFile({ fileNameOrPath: finalFileName }).catch(() => null)
    throw error
  }
}

export const mergeTempChunks = async ({ fileId, totalChunks, onChunkMerged = null }) => {
  const finalFileName = FileUtils.newTempFileName()
  const finalFilePath = FileUtils.tempFilePath(finalFileName)
  const writeStream = FileUtils.createWriteStream(finalFilePath)

  try {
    for (let chunk = 1; chunk <= totalChunks; chunk += 1) {
      // extract temporary chunk content
      const chunkFileName = getChunkFileName({ fileId, chunk })
      const chunkFileStream = await getFileContentAsStream({ fileUuid: chunkFileName })
      await writeReadableToWritable({ readStream: chunkFileStream, writeStream })
      // delete temporary chunk
      await deleteFile({ fileNameOrPath: chunkFileName })
      await onChunkMerged?.({ chunk, totalChunks })
    }
    await endWriteStream(writeStream)
    return finalFilePath
  } catch (error) {
    writeStream.destroy(error)
    await FileUtils.deleteFileAsync(finalFilePath).catch(() => null)
    throw error
  }
}

export const deleteOldTempFiles = async ({ olderThanHours }) => {
  const files = await listFiles({ prefix: tempPrefix })
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
  const oldFiles = files.filter((file) => {
    const fileUuid = file.Key?.slice(tempPrefix.length)
    return fileUuid && file.LastModified && file.LastModified < cutoff
  })
  for (const file of oldFiles) {
    const fileUuid = file.Key.slice(tempPrefix.length)
    await deleteFileCommon({ fileUuid })
  }
  return oldFiles.length
}

const pendingImportPrefix = 'pendingImport/'
const getPendingImportFileKey = ({ fileId }) => `${pendingImportPrefix}${fileId}`

export const keepFileForLaterUse = async ({ fileId, filePath }) => {
  const fileUuid = getPendingImportFileKey({ fileId })
  const contentStream = FileUtils.createReadStream(filePath)
  const contentLength = FileUtils.getFileSize(filePath)
  await uploadFileContentAsStream({ fileUuid, contentStream, contentLength })
  await FileUtils.deleteFileAsync(filePath)
}

// Downloads the kept file into a fresh LOCAL COPY and returns its path; the source S3 object at
// pendingImport/<fileId> is left untouched and is only ever removed by the periodic temp-file TTL
// sweep (deleteOldTempFiles), not by this function or its callers - same lifecycle the local file
// on the fileSystem backend would have had.
export const getKeptFilePath = async ({ fileId }) => {
  const fileUuid = getPendingImportFileKey({ fileId })
  let size
  try {
    size = await getFileSize({ fileUuid })
  } catch (error) {
    // HeadObjectCommand throws a synthesized "NotFound" error (HTTP 404) for a missing key, rather
    // than resolving with a non-finite ContentLength; treat it the same as "not found". Any other
    // error (bad credentials, network failure, permissions, etc.) should propagate.
    if (error?.$metadata?.httpStatusCode === 404) {
      return null
    }
    throw error
  }
  if (!Number.isFinite(size)) {
    return null
  }
  const localFilePath = FileUtils.tempFilePath(FileUtils.newTempFileName())
  const writeStream = FileUtils.createWriteStream(localFilePath)
  try {
    const contentStream = await getFileContentAsStream({ fileUuid })
    await writeReadableToWritable({ readStream: contentStream, writeStream })
    await endWriteStream(writeStream)
    return localFilePath
  } catch (error) {
    writeStream.destroy(error)
    await FileUtils.deleteFileAsync(localFilePath).catch(() => null)
    throw error
  }
}

export const deletePendingImportFileIfAny = async ({ fileId }) => {
  const fileUuid = getPendingImportFileKey({ fileId })
  await deleteFile({ fileNameOrPath: fileUuid })
}

export { uploadFileContent, uploadFileContentAsStream, getFileContentAsStream }
