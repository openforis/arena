import fs, { promises as fsp } from 'node:fs'
import type { Readable } from 'node:stream'
import { ncp } from 'ncp'
import { join } from 'node:path'

import * as ProcessUtils from '@core/processUtils'
import { isUuid, uuidv4 } from '@core/uuid'

const dirSeparator = '/'

const encodings = {
  utf8: 'utf-8',
  base64: 'base64',
} as const

// ====== DIR

export const mkdir = (path: string): Promise<string | undefined> => fsp.mkdir(path, { recursive: true })

export const rmdir = async (path: string): Promise<void> => {
  if (exists(path)) {
    await fsp.rm(path, { recursive: true })
  }
}

export const exists = (path: string): boolean => fs.existsSync(path)

export const canReadWritePath = (path: string): boolean => {
  try {
    fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK)
    return true
  } catch {
    // file not accessible
    return false
  }
}

export const copyDir = ({ source, destination }: { source: string; destination: string }) => ncp(source, destination)

export { join, sep } from 'node:path'

// ====== FILE

export const readFile = (path: string): Promise<string> => fsp.readFile(path, { encoding: encodings.utf8 })

export const readBinaryFile = (path: string): Promise<Buffer> => fsp.readFile(path)

export const writeFile = (path: string, data: Parameters<typeof fsp.writeFile>[1] = ''): Promise<void> =>
  fsp.writeFile(path, data)

export const appendFile = (path: string, data: string | Buffer = ''): Promise<void> => fsp.appendFile(path, data)

export const copyFile = (src: string, dest: string): Promise<void> => fsp.copyFile(src, dest)
export const renameFile = (src: string, dest: string): Promise<void> => fsp.rename(src, dest)

export const { createWriteStream, createReadStream } = fs

export const getFileSize = (path: string): number => {
  const stats = fs.statSync(path)
  const { size } = stats
  return size
}

export const visitDirFiles = ({ path, visitor }: { path: string; visitor: (filePath: string) => void }): void => {
  if (!exists(path)) return

  const stack: string[] = []
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

export const getDirSize = (path: string): number => {
  let totalSize = 0
  visitDirFiles({
    path,
    visitor: (filePath) => {
      totalSize = totalSize + getFileSize(filePath)
    },
  })
  return totalSize
}

// file name or file object (e.g. uploaded file)
type FileOrName = string | { name: string }

const getFileName = (file: FileOrName): string => (typeof file === 'string' ? file : file.name)

export const getFileExtension = (file: FileOrName): string => {
  const fileName = getFileName(file)
  const lastIndexOfDot = fileName.lastIndexOf('.')
  return lastIndexOfDot > 0 ? fileName.substring(lastIndexOfDot + 1) : fileName
}

export const getBaseName = (file: FileOrName): string => {
  const fileName = getFileName(file)
  const lastIndexOfDot = fileName.lastIndexOf('.')
  return lastIndexOfDot > 0 ? fileName.substring(0, lastIndexOfDot) : fileName
}

export const deleteFile = (path: string): void => fs.unlinkSync(path)
export const deleteFileAsync = (path: string): Promise<void> => fsp.unlink(path)
export const rename = (oldPath: string, newPath: string): Promise<void> => fsp.rename(oldPath, newPath)

// ======= Temp Files
export const newTempFileName = (): string => `${uuidv4()}.tmp`
export const newTempFolderName = (): string => uuidv4()
export const tempFilePath = (fileName: string, subfolderName: string | null = null): string =>
  subfolderName
    ? join(ProcessUtils.ENV.tempFolder, subfolderName, fileName)
    : join(ProcessUtils.ENV.tempFolder, fileName)
export const newTempFilePath = (): string => tempFilePath(newTempFileName())
export const newTempFolderPath = (): string => tempFilePath(newTempFolderName())
export const checkIsValidTempFileName = (tempFileName: string | null | undefined): boolean => {
  if (!tempFileName || !isUuid(getBaseName(tempFileName)) || !exists(tempFilePath(tempFileName))) {
    throw new Error(`Invalid temp file name: ${tempFileName}`)
  }
  return true
}
export const writeStreamToTempFile = (inputStream: Readable): Promise<{ tempFilePath: string }> =>
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
