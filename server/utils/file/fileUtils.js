import fs from 'fs'
const fsPromise = Promise.promisifyAll(fs)

export const readFile = async filePath => await fsPromise.readFileAsync(filePath, {encoding: 'utf-8'})
