const fs = require('fs')
const transform = require('csv').transform
const stringify = require('csv').stringify

const writeToStream = (stream, data) => {

  return new Promise((resolve, reject) => {
    transform(
      data,
      row => row
    )
      .pipe(stringify())
      .pipe(stream)
      .on('error', err => reject(err))
      .on('finish', resolve())

  })

}

const writeToFile = (filePath, data) => writeToStream(fs.createWriteStream(filePath), data)

module.exports = {
  writeToFile,
  writeToStream,
}