import { promises } from 'fs'

// ====== DIR

export const mkdir = async path => await promises.mkdir(path, { recursive: true })

export const rmdir = async path => await promises.rmdir(path, { recursive: true })

export { join, sep } from 'path'

// ====== FILE

export const readFile = async filePath => await promises.readFile(filePath, { encoding: 'utf8' })

export const appendFile = async (path, data = '') => await promises.appendFile(path, data)

export const copyFile = async (src, dest) => await promises.copyFile(src, dest)
