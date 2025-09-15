import * as Request from './request'
import * as FileUtils from './file/fileUtils'

export const processChunkedFile = async ({ req }) => {
  const { fileId = undefined, chunk = undefined, totalChunks = undefined } = Request.getParams(req)
  const requestFilePath = Request.getFilePath(req)

  if (totalChunks) {
    await FileUtils.writeChunkToTempFile({ filePath: requestFilePath, fileId, chunk })
    await FileUtils.deleteFileAsync(requestFilePath)
  }
  if (!totalChunks || chunk === totalChunks) {
    if (totalChunks) {
      // chunks complete: merge them into a single one and return that file path
      return FileUtils.mergeTempChunks({ fileId, totalChunks })
    }
    // no file chunking: return request file path
    return requestFilePath
  }
  if (totalChunks) {
    // chunks not finished
    return null
  }
  throw new Error('Invalid chunk number')
}
