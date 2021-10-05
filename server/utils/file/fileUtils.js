import fs, { promises } from 'fs'
import { ncp } from 'ncp'
import { join, sep } from 'path'

import * as ProcessUtils from '../../../core/processUtils'
import { uuidv4 } from '../../../core/uuid'

// ====== DIR

export const mkdir = async (path) => promises.mkdir(path, { recursive: true })

export const rmdir = async (path) => promises.rmdir(path, { recursive: true })

export const existsDir = (path) => fs.existsSync(path)

export const copyDir = ({ source, destination }) => ncp(source, destination)

export { join, sep }

// ====== FILE

export const readFile = async (path) => promises.readFile(path, { encoding: 'utf8' })

export const writeFile = async (path, data = '') => promises.writeFile(path, data)

export const appendFile = async (path, data = '') => promises.appendFile(path, data)

export const copyFile = async (src, dest) => promises.copyFile(src, dest)

export const createWriteSteam = fs.createWriteStream

// ======= Temp Files
export const newTempFileName = () => `${uuidv4()}.tmp`
export const tempFilePath = (fileName) => join(ProcessUtils.ENV.tempFolder, fileName)
