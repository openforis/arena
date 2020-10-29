import fs, { promises } from 'fs'
import { ncp } from 'ncp'

// ====== DIR

export const mkdir = async (path) => promises.mkdir(path, { recursive: true })

export const rmdir = async (path) => promises.rmdir(path, { recursive: true })

export const existsDir = (path) => fs.existsSync(path)

export const copyDir = ({ source, destination }) => ncp(source, destination)

export { join, sep } from 'path'

// ====== FILE

export const readFile = async (filePath) => promises.readFile(filePath, { encoding: 'utf8' })

export const appendFile = async (path, data = '') => promises.appendFile(path, data)

export const copyFile = async (src, dest) => promises.copyFile(src, dest)
