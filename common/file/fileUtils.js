const fs      = Promise.promisifyAll(require('fs'))

const readFile = async filePath => await fs.readFileAsync(filePath, {encoding: 'utf-8'})

module.exports = {
  readFile
}