import * as _fs from 'fs'

// @ts-ignore TODO declare environment where promisifyAll exists
const fs = Promise.promisifyAll(_fs);

export const readFile = async filePath => await fs.readFileAsync(filePath, { encoding: 'utf-8' })

export default {
  readFile
};
