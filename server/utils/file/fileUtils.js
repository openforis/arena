import { promises } from 'fs'

export const readFile = filePath => promises.readFile(filePath, { encoding: 'utf-8' })
