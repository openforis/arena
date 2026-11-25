import type { Request as ExpressRequest } from 'express'

import { isUuid } from '@core/uuid'
import * as FileUtils from '../../../utils/file/fileUtils'
import * as Request from '../../../utils/request'
import * as TempFileManager from '../manager/tempFileManager'

const getFileContentOrPath = (req: ExpressRequest) => {
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

const newBadRequestError = (message: string) => Object.assign(new Error(message), { statusCode: 400 })

const writeChunkIfNeeded = async ({
  filePath,
  fileContent,
  fileId,
  chunk,
  totalChunks,
}: {
  filePath: string
  fileContent: Buffer | string
  fileId: string
  chunk: number
  totalChunks: number
}) => {
  const isSingleFile = !totalChunks

  if (!isSingleFile) {
    await TempFileManager.writeChunkToTempFile({ filePath, fileContent, fileId, chunk })
    if (filePath) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }

  return { isSingleFile }
}

const getChunkedFileParams = (req: ExpressRequest) => {
  const { fileId = undefined } = Request.getParams(req)
  const { filePath, fileContent } = getFileContentOrPath(req)

  const chunk = Request.getNumericParam(req, 'chunk')
  const totalChunks = Request.getNumericParam(req, 'totalChunks')
  const totalFileSize = Request.getNumericParam(req, 'totalFileSize')

  const isChunkedUpload = totalChunks !== null

  if (isChunkedUpload) {
    const isValidPositiveInteger = (value) => Number.isFinite(value) && Number.isInteger(value) && value > 0

    // fileId is used to name the temp chunk files
    if (typeof fileId !== 'string' || !isUuid(fileId)) {
      throw newBadRequestError('Invalid fileId for chunked upload')
    }
    if (!isValidPositiveInteger(chunk) || !isValidPositiveInteger(totalChunks)) {
      throw newBadRequestError('Invalid chunk or totalChunks for chunked upload')
    }
    if (!isValidPositiveInteger(totalFileSize)) {
      throw newBadRequestError('Invalid totalFileSize for chunked upload')
    }
  }
  return { chunk, fileContent, fileId, filePath, totalChunks, totalFileSize }
}

export type ChunkedFileUploadResult = {
  filePath?: string
  fileId?: string
  totalChunks?: number
  totalFileSize?: number
}

/**
 * Processes an uploaded file request without merging the last chunked upload.
 * Returns the original file path for single-file uploads, chunk metadata for completed chunked uploads,
 * or null while chunks are still being uploaded.
 * @param {object} params - Function parameters.
 * @param {object} params.req - The HTTP request.
 * @returns {Promise<{filePath?: string, fileId?: string, totalChunks?: number, totalFileSize?: number}|null>} The file path or chunk metadata when upload is complete; otherwise null.
 */
export const processChunkedFileForBackgroundMerge = async ({
  req,
}: {
  req: ExpressRequest
}): Promise<ChunkedFileUploadResult | null> => {
  const { chunk, fileContent, fileId, filePath, totalChunks, totalFileSize } = getChunkedFileParams(req)

  const { isSingleFile } = await writeChunkIfNeeded({
    filePath,
    fileContent,
    fileId,
    chunk,
    totalChunks,
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
