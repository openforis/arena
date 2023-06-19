import fs, { promises } from 'fs'
import { ncp } from 'ncp'
import { join, sep } from 'path'

import * as ProcessUtils from '../../../core/processUtils'
import { uuidv4 } from '../../../core/uuid'

// ====== DIR

export const mkdir = async (path) => promises.mkdir(path, { recursive: true })

export const rmdir = async (path) => {
  if (existsDir(path)) {
    await promises.rmdir(path, { recursive: true })
  }
}

export const existsDir = (path) => fs.existsSync(path)

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

export const readFile = async (path) => promises.readFile(path, { encoding: 'utf8' })

export const readBinaryFile = async (path) => promises.readFile(path)

export const writeFile = async (path, data = '') => promises.writeFile(path, data)

export const appendFile = async (path, data = '') => promises.appendFile(path, data)

export const copyFile = async (src, dest) => promises.copyFile(src, dest)

export const { createWriteStream, createReadStream } = fs

export const getFileSize = (path) => {
  const stats = fs.statSync(path)
  const { size } = stats
  return size
}

export const getFileExtension = (file) => {
  const fileName = typeof file === 'string' ? file : file.name
  const extension = fileName.split('.').pop()
  return extension
}

export const deleteFile = (path) => fs.unlinkSync(path)
export const deleteFileAsync = (path) => promises.unlink(path)

// ======= Temp Files
export const newTempFileName = () => `${uuidv4()}.tmp`
export const newTempFolderName = () => uuidv4()
export const tempFilePath = (fileName, subfolderName = null) =>
  subfolderName
    ? join(ProcessUtils.ENV.tempFolder, subfolderName, fileName)
    : join(ProcessUtils.ENV.tempFolder, fileName)
export const newTempFilePath = () => tempFilePath(newTempFileName())
export const newTempFolderPath = () => tempFilePath(newTempFolderName())
