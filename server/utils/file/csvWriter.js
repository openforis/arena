import * as fs from 'fs'
import * as R from 'ramda'
import { transform, stringify } from 'csv'

import * as StringUtils from '@core/stringUtils'

const _transformObj =
  (options = {}) =>
  (obj) => {
    const { removeNewLines = true } = options
    return Object.entries(obj).reduce(
      (objAcc, [key, value]) =>
        Object.assign(objAcc, { [key]: removeNewLines ? StringUtils.removeNewLines(value) : value }),
      {}
    )
  }

export const transformToStream = (stream, columns = null, options = {}) => {
  const { objectTransformer = null } = options
  const transformFunction = objectTransformer || _transformObj(options)
  const transformer = transform(transformFunction)
  transformer
    // eslint-disable-next-line camelcase
    .pipe(stringify({ quoted_string: true, header: true, columns }))
    .pipe(stream)
  return transformer
}

export const writeToStream = (stream, data, options = {}) =>
  new Promise((resolve, reject) => {
    const transformer = transformToStream(stream, R.pipe(R.head, R.keys)(data), options)
    transformer.on('error', reject).on('finish', resolve)

    data.forEach((row) => transformer.write(row))
    transformer.end()
  })

export const writeToFile = (filePath, data) => writeToStream(fs.createWriteStream(filePath), data)
