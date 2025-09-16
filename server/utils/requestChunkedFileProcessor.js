import * as Request from './request'
import * as FileUtils from './file/fileUtils'

export const processChunkedFile = async ({ req }) => {
  const { fileId = undefined, chunk = undefined, totalChunks = undefined } = Request.getParams(req)
  const requestFilePath = Request.getFilePath(req)

  const isSingleFile = !totalChunks

  if (!isSingleFile) {
    await FileUtils.writeChunkToTempFile({ filePath: requestFilePath, fileId, chunk })
    await FileUtils.deleteFileAsync(requestFilePath)
  }

  const isChunkingComplete = totalChunks && chunk === totalChunks

  if (isChunkingComplete) {
    // All file chunks have been received; merge them and return the file path.
    return FileUtils.mergeTempChunks({ fileId, totalChunks })
  }
  if (isSingleFile) {
    // No file chunking was used; return the original file path.
    return requestFilePath
  }
  if (Number(chunk) < Number(totalChunks)) {
    // File chunks are still being uploaded; return null to indicate the process isn't complete.
    return null
  }
  throw new Error('Invalid chunk number')
}
