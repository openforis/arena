import { PassThrough } from 'node:stream'

import * as FileUtils from '@server/utils/file/fileUtils'
import { endWriteStream, writeReadableToWritable } from '@server/utils/ioUtils'

import { createS3BucketRepository } from './fileRepositoryS3BucketCommon'
import { getChunkFileName } from '../tempFileUtils'

export { checkCanAccessS3Bucket } from './fileRepositoryS3BucketCommon'

const getTempFileKey = ({ fileUuid }) => `temp/${fileUuid}`

const { uploadFileContent, uploadFileContentAsStream, getFileContentAsStream, getFileSize, deleteFile, deleteFiles } =
  createS3BucketRepository({
    getFileKey: getTempFileKey,
  })

export const writeChunkToTempFile = async ({ filePath = null, fileContent = null, fileId, chunk }) => {
  const fileUuid = getChunkFileName({ fileId, chunk })
  if (filePath) {
    const contentStream = FileUtils.createReadStream(filePath)
    const contentLength = FileUtils.getFileSize(filePath)
    await uploadFileContentAsStream({ fileUuid, contentStream, contentLength })
  } else if (fileContent) {
    await uploadFileContent({ fileUuid, content: fileContent })
  } else {
    throw new Error('Missing file path or content')
  }
}

const calculateTotalChunksSize = async ({ totalChunks, fileId }) => {
  let totalContentLength = 0
  for (let chunk = 1; chunk <= totalChunks; chunk += 1) {
    const chunkFileName = getChunkFileName({ fileId, chunk })
    const chunkSize = await getFileSize({ fileUuid: chunkFileName })
    if (!Number.isFinite(chunkSize)) {
      throw new Error(`Cannot determine size of temp chunk ${chunkFileName}`)
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
      await deleteFile({ fileUuid: chunkFileName })
    }

    uploadStream.end()
    await uploadPromise

    return finalFileName
  } catch (error) {
    uploadStream.destroy(error)
    await uploadPromise.catch(() => null)
    await deleteFile({ fileUuid: finalFileName }).catch(() => null)
    throw error
  }
}

export const mergeTempChunks = async ({ fileId, totalChunks }) => {
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
      await deleteFile({ fileUuid: chunkFileName })
    }

    await endWriteStream(writeStream)
    return finalFileName
  } catch (error) {
    writeStream.destroy(error)
    await FileUtils.deleteFileAsync(finalFilePath).catch(() => null)
    throw error
  }
}

export { uploadFileContent, uploadFileContentAsStream, getFileContentAsStream, deleteFile, deleteFiles }
