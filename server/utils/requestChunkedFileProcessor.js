import * as Request from './request'
import * as FileUtils from './file/fileUtils'

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
  throw new Error('Missing file content or path in request')
}

export const processChunkedFile = async ({ req }) => {
  const { fileId = undefined, chunk = undefined, totalChunks = undefined } = Request.getParams(req)
  const { filePath, fileContent } = getFileContentOrPath(req)

  const chunksAreText = !!fileContent

  const isSingleFile = !totalChunks

  if (!isSingleFile) {
    await FileUtils.writeChunkToTempFile({ filePath, fileContent, fileId, chunk })
    if (filePath) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }

  const isChunkingComplete = totalChunks && chunk === totalChunks

  if (isChunkingComplete) {
    // All file chunks have been received; merge them and return the file path.
    return FileUtils.mergeTempChunks({ fileId, totalChunks, chunksAreText })
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
