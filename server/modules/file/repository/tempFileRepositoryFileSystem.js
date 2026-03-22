import * as FileUtils from '@server/utils/file/fileUtils'
import { endWriteStream, writeStreamAndWaitForEnd } from '@server/utils/ioUtils'

import { getChunkFileName } from '../tempFileUtils'

export const deleteFile = async ({ fileUuid }) => {
  const filePath = fileUuid.startsWith('/') ? fileUuid : FileUtils.tempFilePath(fileUuid)
  await FileUtils.deleteFileAsync(filePath)
}

export const writeChunkToTempFile = async ({ filePath = null, fileContent = null, fileId, chunk }) => {
  const destFileName = getChunkFileName({ fileId, chunk })
  const destFilePath = FileUtils.tempFilePath(destFileName)
  if (filePath) {
    await FileUtils.copyFile(filePath, destFilePath)
  } else if (fileContent) {
    await FileUtils.writeFile(destFilePath, fileContent)
  } else {
    throw new TypeError('Missing file path or content')
  }
}

export const mergeTempChunks = async ({ fileId, totalChunks }) => {
  const finalFileName = FileUtils.newTempFileName()
  const finalFilePath = FileUtils.tempFilePath(finalFileName)
  const writeStream = FileUtils.createWriteStream(finalFilePath)
  for (let chunk = 1; chunk <= totalChunks; chunk += 1) {
    // extract temporary chunk content
    const chunkFileName = getChunkFileName({ fileId, chunk })
    const chunkFilePath = FileUtils.tempFilePath(chunkFileName)
    const chunkFileContent = await FileUtils.readBinaryFile(chunkFilePath)
    await writeStreamAndWaitForEnd({ writeStream, chunkFileContent })
    // delete temporary chunk
    await FileUtils.deleteFileAsync(chunkFilePath)
  }
  await endWriteStream(writeStream)
  return finalFileName
}
