import fs, { promises as fsp } from 'fs'
import { ncp } from 'ncp'
import { join, sep } from 'path'

import * as ProcessUtils from '@core/processUtils'
import { isUuid, uuidv4 } from '@core/uuid'

import * as Log from '@server/log/log'

const logger = Log.getLogger('FileUtils')

const dirSeparator = '/'

const encodings = {
  utf8: 'utf-8',
  base64: 'base64',
}

// ====== DIR

export const mkdir = async (path) => fsp.mkdir(path, { recursive: true })

export const rmdir = async (path) => {
  if (exists(path)) {
    await fsp.rm(path, { recursive: true })
  }
}

export const exists = (path) => fs.existsSync(path)

export const canReadWritePath = (path) => {
  try {
    fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK)
    return true
  } catch (e) {
    return false
  }
}

export const copyDir = ({ source, destination }) => ncp(source, destination)

export { join, sep }

// ====== FILE

export const readFile = async (path) => fsp.readFile(path, { encoding: encodings.utf8 })

export const readBinaryFile = async (path) => fsp.readFile(path)

export const writeFile = async (path, data = '') => fsp.writeFile(path, data)

export const appendFile = async (path, data = '') => fsp.appendFile(path, data)

export const copyFile = async (src, dest) => fsp.copyFile(src, dest)

export const { createWriteStream, createReadStream } = fs

export const getFileSize = (path) => {
  const stats = fs.statSync(path)
  const { size } = stats
  return size
}

export const visitDirFiles = ({ path, visitor }) => {
  if (!exists(path)) return

  const stack = []
  const files = fs.readdirSync(path)
  stack.push(...files.map((file) => path + dirSeparator + file))

  while (stack.length > 0) {
    const filePath = stack.pop()

    visitor(filePath)

    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      const filesPaths = fs.readdirSync(filePath).map((file) => filePath + dirSeparator + file)
      stack.push(...filesPaths)
    }
  }
}

export const getDirSize = (path) => {
  let totalSize = 0
  visitDirFiles({
    path,
    visitor: (filePath) => {
      totalSize = totalSize + getFileSize(filePath)
    },
  })
  return totalSize
}

const getFileName = (file) => (typeof file === 'string' ? file : file.name)

export const getFileExtension = (file) => {
  const fileName = getFileName(file)
  const lastIndexOfDot = fileName.lastIndexOf('.')
  return lastIndexOfDot > 0 ? fileName.substring(lastIndexOfDot + 1) : fileName
}

export const getBaseName = (file) => {
  const fileName = getFileName(file)
  const lastIndexOfDot = fileName.lastIndexOf('.')
  return lastIndexOfDot > 0 ? fileName.substring(0, lastIndexOfDot) : fileName
}

export const deleteFile = (path) => fs.unlinkSync(path)
export const deleteFileAsync = (path) => fsp.unlink(path)

// ======= Temp Files
export const newTempFileName = () => `${uuidv4()}.tmp`
export const newTempFolderName = () => uuidv4()
export const tempFilePath = (fileName, subfolderName = null) =>
  subfolderName
    ? join(ProcessUtils.ENV.tempFolder, subfolderName, fileName)
    : join(ProcessUtils.ENV.tempFolder, fileName)
export const newTempFilePath = () => tempFilePath(newTempFileName())
export const newTempFolderPath = () => tempFilePath(newTempFolderName())
export const checkIsValidTempFileName = (tempFileName) => {
  if (!tempFileName || !isUuid(getBaseName(tempFileName)) || !exists(tempFilePath(tempFileName))) {
    throw new Error(`Invalid temp file name: ${tempFileName}`)
  }
  return true
}
export const writeStreamToTempFile = async (inputStream) =>
  new Promise((resolve, reject) => {
    const tempFilePath = newTempFilePath()
    const writeStream = createWriteStream(tempFilePath)
    inputStream.pipe(writeStream)
    writeStream.on('close', () => {
      resolve({ tempFilePath })
    })
    writeStream.on('error', (error) => {
      reject(error)
    })
  })

const _getChunkFileName = ({ fileId, chunk }) => `${fileId}_part${chunk}`

export const writeChunkToTempFile = async ({ filePath = null, fileContent = null, fileId, chunk }) => {
  const destFileName = _getChunkFileName({ fileId, chunk })
  const destFilePath = tempFilePath(destFileName)
  if (filePath) {
    await copyFile(filePath, destFilePath)
  } else if (fileContent) {
    await writeFile(destFilePath, fileContent)
  } else {
    throw new Error('Missing file path or content')
  }
}

export const mergeTempChunks = async ({ fileId, totalChunks, chunksAreText = false }) => {
  const finalFilePath = newTempFilePath()
  const writeStream = createWriteStream(finalFilePath)
  for (let chunk = 1; chunk <= totalChunks; chunk += 1) {
    const chunkFileName = _getChunkFileName({ fileId, chunk })
    const chunkFilePath = tempFilePath(chunkFileName)
    if (chunksAreText) {
      const base64Content = await readFile(chunkFilePath)
      const decodedBuffer = Buffer.from(base64Content, encodings.base64)
      logger.debug(`==== processing chunk: ${chunk} = content: ${base64Content}`)
      writeStream.write(decodedBuffer)
    } else {
      const chunkFileContent = await readBinaryFile(chunkFilePath)
      writeStream.write(chunkFileContent)
    }
    await deleteFileAsync(chunkFilePath)
  }
  writeStream.end()
  return finalFilePath
}
