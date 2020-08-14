import * as fs from 'fs'
import * as R from 'ramda'
import { transform, stringify } from 'csv'

import * as StringUtils from '@core/stringUtils'

const _transformObj = (obj) =>
  Object.entries(obj).reduce(
    (objAcc, [key, value]) => Object.assign(objAcc, { [key]: StringUtils.removeNewLines(value) }),
    {}
  )

export const transformToStream = (stream, columns) => {
  const transformer = transform(_transformObj)
  transformer
    // eslint-disable-next-line camelcase
    .pipe(stringify({ quoted_string: true, header: true, columns }))
    .pipe(stream)
  return transformer
}

export const writeToStream = (stream, data) =>
  new Promise((resolve, reject) => {
    const transformer = transformToStream(stream, R.pipe(R.head, R.keys)(data))
    transformer.on('error', reject).on('finish', resolve)

    data.forEach((row) => transformer.write(row))
    transformer.end()
  })

export const writeToFile = (filePath, data) => writeToStream(fs.createWriteStream(filePath), data)
