import * as FileUtils from '@server/utils/file/fileUtils'
import { endWriteStream, writeStreamAndWaitForEnd } from '@server/utils/ioUtils'
import { getChunkFileName } from '../tempFileUtils'

export const deleteFile = async ({ fileNameOrPath }: { fileNameOrPath: string }) => {
  const filePath = fileNameOrPath.startsWith('/') ? fileNameOrPath : FileUtils.tempFilePath(fileNameOrPath)
  await FileUtils.deleteFileAsync(filePath)
}

export const writeChunkToTempFile = async ({
  filePath = null,
  fileContent = null,
  fileId,
  chunk,
}: {
  filePath?: string
  fileContent?: Buffer | string
  fileId: string
  chunk: number
}) => {
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

export const mergeTempChunks = async ({
  fileId,
  totalChunks,
  onChunkMerged = null,
}: {
  fileId: string
  totalChunks: number
  onChunkMerged?: ((progress: { chunk: number; totalChunks: number }) => Promise<void> | void) | null
}) => {
  const finalFileName = FileUtils.newTempFileName()
  const finalFilePath = FileUtils.tempFilePath(finalFileName)
  const writeStream = FileUtils.createWriteStream(finalFilePath)
  for (let chunk = 1; chunk <= totalChunks; chunk += 1) {
    // extract temporary chunk content
    const chunkFileName = getChunkFileName({ fileId, chunk })
    const chunkFilePath = FileUtils.tempFilePath(chunkFileName)
    const chunkFileContent = await FileUtils.readBinaryFile(chunkFilePath) // NOSONAR
    await writeStreamAndWaitForEnd({ writeStream, chunkFileContent }) // NOSONAR
    // delete temporary chunk
    await FileUtils.deleteFileAsync(chunkFilePath) // NOSONAR
    await onChunkMerged?.({ chunk, totalChunks }) // NOSONAR
  }
  await endWriteStream(writeStream)
  return finalFilePath
}

const pendingImportFilePrefix = 'pendingImport_'
const getPendingImportFileName = (fileId: string) => `${pendingImportFilePrefix}${fileId}`

export const keepFileForLaterUse = async ({ fileId, filePath }: { fileId: string; filePath: string }) => {
  const destPath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  await FileUtils.renameFile(filePath, destPath)
}

export const getKeptFilePath = ({ fileId }: { fileId: string }) => {
  const filePath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  if (!FileUtils.exists(filePath)) {
    return Promise.resolve(null)
  }
  return Promise.resolve(filePath)
}

export const deletePendingImportFileIfAny = async ({ fileId }: { fileId: string }) => {
  const filePath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  if (FileUtils.exists(filePath)) {
    await FileUtils.deleteFileAsync(filePath)
  }
}
