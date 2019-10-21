const R = require('ramda')
const fs = require('fs')
const { transform, stringify } = require('csv')

const StringUtils = require('../../../core/stringUtils')

const _transformObj = obj => Object.entries(obj).reduce(
  (objAcc, [key, value]) => Object.assign(objAcc, { [key]: StringUtils.removeNewLines(value) }),
  {}
)

const transformToStream = (stream, columns) => {
  const transformer = transform(_transformObj)
  transformer
    .pipe(stringify({ quoted_string: true, header: true, columns }))
    .pipe(stream)
  return transformer
}

const writeToStream = (stream, data) => new Promise((resolve, reject) => {
  const transformer = transformToStream(stream, R.pipe(R.head, R.keys)(data))
  transformer
    .on('error', reject)
    .on('finish', resolve)

  data.forEach(row => transformer.write(row))
  transformer.end()
})

const writeToFile = (filePath, data) => writeToStream(fs.createWriteStream(filePath), data)

module.exports = {
  transformToStream,
  writeToFile,
  writeToStream,
}
