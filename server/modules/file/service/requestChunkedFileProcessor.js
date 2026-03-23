import * as Request from '../../../utils/request'
import * as FileUtils from '../../../utils/file/fileUtils'

import * as TempFileManager from '../manager/tempFileManager'

const getFileContentOrPath = (req) => {
  const filePath = Request.getFilePath(req)
  if (filePath) {
    return { filePath }
  }
  const params = Request.getParams(req)
  const { file: fileContentBase64 } = params
  if (fileContentBase64) {
    return { fileContent: Buffer.from(fileContentBase64, 'base64') }
  }
  throw new TypeError('Missing file content or path in request')
}

const writeChunkIfNeeded = async ({ filePath, fileContent, fileId, chunk, totalChunks, totalFileSize }) => {
  const isSingleFile = !totalChunks

  if (!isSingleFile) {
    await TempFileManager.writeChunkToTempFile({ filePath, fileContent, fileId, chunk, totalChunks, totalFileSize })
    if (filePath) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }

  return { isSingleFile }
}

const getChunkedFileParams = (req) => {
  const { fileId = undefined } = Request.getParams(req)
  const { filePath, fileContent } = getFileContentOrPath(req)

  const chunk = Request.getNumericParam(req, 'chunk')
  const totalChunks = Request.getNumericParam(req, 'totalChunks')
  const totalFileSize = Request.getNumericParam(req, 'totalFileSize')

  const isChunkedUpload = totalChunks !== null

  if (isChunkedUpload) {
    const isValidPositiveInteger = (value) => Number.isFinite(value) && Number.isInteger(value) && value > 0

    if (typeof fileId !== 'string' || fileId.trim() === '') {
      const error = new Error('Invalid fileId for chunked upload')
      error.statusCode = 400
      throw error
    }
    if (!isValidPositiveInteger(chunk) || !isValidPositiveInteger(totalChunks)) {
      const error = new Error('Invalid chunk or totalChunks for chunked upload')
      error.statusCode = 400
      throw error
    }
    if (!isValidPositiveInteger(totalFileSize)) {
      const error = new Error('Invalid totalFileSize for chunked upload')
      error.statusCode = 400
      throw error
    }
  }
  return { chunk, fileContent, fileId, filePath, totalChunks, totalFileSize }
}

/**
 * Processes an uploaded file request without merging the last chunked upload.
 * Returns the original file path for single-file uploads, chunk metadata for completed chunked uploads,
 * or null while chunks are still being uploaded.
 * @param {object} params - Function parameters.
 * @param {object} params.req - The HTTP request.
 * @returns {Promise<object|null>} The file path or chunk metadata when upload is complete; otherwise null.
 */
export const processChunkedFileForBackgroundMerge = async ({ req }) => {
  const { chunk, fileContent, fileId, filePath, totalChunks, totalFileSize } = getChunkedFileParams(req)

  const { isSingleFile } = await writeChunkIfNeeded({
    filePath,
    fileContent,
    fileId,
    chunk,
    totalChunks,
    totalFileSize,
  })

  const isChunkingComplete = totalChunks && chunk === totalChunks

  if (isChunkingComplete) {
    return { fileId, totalChunks, totalFileSize }
  }
  if (isSingleFile) {
    return { filePath }
  }
  if (Number(chunk) < Number(totalChunks)) {
    return null
  }
  throw new Error('Invalid chunk number')
}
