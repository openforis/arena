import * as R from 'ramda'
import { Transform } from 'json2csv'

import * as StringUtils from '@core/stringUtils'

const defaultOptions = { objectTransformer: null, removeNewLines: true }

const _transformObj =
  (options = {}) =>
  (obj) => {
    const { removeNewLines = true } = options
    if (!removeNewLines) return obj

    Object.entries(obj).forEach(([key, value]) => {
      obj[key] = StringUtils.removeNewLines(value)
    })
    return obj
  }

export const writeItemsToStream = (stream, data, options = defaultOptions) =>
  new Promise((resolve, reject) => {
    const fields = R.pipe(R.head, R.keys)(data)
    const transform = transformJsonToCsv({ fields, options })
    transform.pipe(stream)
    transform.on('error', reject).on('finish', resolve)

    data.forEach((row) => transform.write(row))
    transform.end()
  })

export const transformJsonToCsv = ({ fields, options: optionsParam = defaultOptions }) => {
  const options = { ...defaultOptions, ...optionsParam }
  const { objectTransformer = null } = options
  const transform = objectTransformer || _transformObj(options)
  const opts = { fields, transforms: [transform] }
  const transformOpts = {
    objectMode: true,
    highWaterMark: 512,
  }
  return new Transform(opts, transformOpts)
}
