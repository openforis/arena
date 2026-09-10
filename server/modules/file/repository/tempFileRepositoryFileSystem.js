import * as FileUtils from '@server/utils/file/fileUtils'
import { endWriteStream, writeStreamAndWaitForEnd } from '@server/utils/ioUtils'

import { getChunkFileName } from '../tempFileUtils'

export const deleteFile = async ({ fileNameOrPath }) => {
  const filePath = fileNameOrPath.startsWith('/') ? fileNameOrPath : FileUtils.tempFilePath(fileNameOrPath)
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

export const mergeTempChunks = async ({ fileId, totalChunks, onChunkMerged = null }) => {
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
    await onChunkMerged?.({ chunk, totalChunks })
  }
  await endWriteStream(writeStream)
  return finalFilePath
}

const pendingImportFilePrefix = 'pendingImport_'
const getPendingImportFileName = (fileId) => `${pendingImportFilePrefix}${fileId}`

export const keepFileForLaterUse = async ({ fileId, filePath }) => {
  const destPath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  await FileUtils.renameFile(filePath, destPath)
}

export const getKeptFilePath = async ({ fileId }) => {
  const filePath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  if (!FileUtils.exists(filePath)) {
    return null
  }
  return filePath
}

export const deletePendingImportFileIfAny = async ({ fileId }) => {
  const filePath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  if (FileUtils.exists(filePath)) {
    await FileUtils.deleteFileAsync(filePath)
  }
}
