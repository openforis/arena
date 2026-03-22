import { PassThrough } from 'node:stream'

import * as FileUtils from '@server/utils/file/fileUtils'
import { writeReadableToWritable } from '@server/utils/ioUtils'

import { checkCanAccessS3Bucket, createS3BucketRepository } from './fileRepositoryS3BucketCommon'
import { getChunkFileName } from '../tempFileUtils'

const getTempFileKey = ({ fileUuid }) => `temp/${fileUuid}`

const { uploadFileContent, uploadFileContentAsStream, getFileContentAsStream, deleteFile, deleteFiles } =
  createS3BucketRepository({
    getFileKey: getTempFileKey,
  })

export const writeChunkToTempFile = async ({ filePath = null, fileContent = null, fileId, chunk }) => {
  const fileUuid = getChunkFileName({ fileId, chunk })
  if (filePath) {
    const content = await FileUtils.readBinaryFile(filePath)
    await uploadFileContent({ fileUuid, content })
  } else if (fileContent) {
    await uploadFileContent({ fileUuid, content: fileContent })
  } else {
    throw new Error('Missing file path or content')
  }
}

export const mergeTempChunks = async ({ fileId, totalChunks }) => {
  const finalFileName = FileUtils.newTempFileName()
  const uploadStream = new PassThrough()
  const uploadPromise = uploadFileContentAsStream({ fileUuid: finalFileName, contentStream: uploadStream })

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

export {
  checkCanAccessS3Bucket,
  uploadFileContent,
  uploadFileContentAsStream,
  getFileContentAsStream,
  deleteFile,
  deleteFiles,
}
