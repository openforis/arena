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

export const writeItemsToStream = ({ outputStream, items, fields: fieldsParam = null, options = defaultOptions }) =>
  new Promise((resolve, reject) => {
    const fields = fieldsParam || Object.keys(items)[0]
    const transform = transformJsonToCsv({ fields, options })
    transform.pipe(outputStream)
    transform.on('error', reject).on('finish', resolve)

    items.forEach((row) => transform.write(row))
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
