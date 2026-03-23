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

export const processChunkedFile = async ({ req }) => {
  const { fileId = undefined } = Request.getParams(req)
  const { filePath, fileContent } = getFileContentOrPath(req)

  const chunk = Request.getNumericParam(req, 'chunk')
  const totalChunks = Request.getNumericParam(req, 'totalChunks')
  const totalFileSize = Request.getNumericParam(req, 'totalFileSize')

  const isSingleFile = !totalChunks

  if (!isSingleFile) {
    await TempFileManager.writeChunkToTempFile({ filePath, fileContent, fileId, chunk, totalChunks, totalFileSize })
    if (filePath) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }

  const isChunkingComplete = totalChunks && chunk === totalChunks

  if (isChunkingComplete) {
    // All file chunks have been received; merge them and return the temp file name.
    return TempFileManager.mergeTempChunks({ fileId, totalChunks, totalFileSize })
  }
  if (isSingleFile) {
    // No file chunking was used; return the original file path.
    return filePath
  }
  if (Number(chunk) < Number(totalChunks)) {
    // File chunks are still being uploaded; return null to indicate the process isn't complete.
    return null
  }
  throw new Error('Invalid chunk number')
}
