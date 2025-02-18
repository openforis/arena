import { Transform } from 'json2csv'

import * as StringUtils from '@core/stringUtils'

import * as CSVWriter from './csvWriter'
import * as ExcelWriter from './excelWriter'
import { FlatDataWriterUtils } from './flatDataWriterUtils'
import { FileFormats } from './fileFormats'

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

export const transformJsonToCsv = ({ fields, options: optionsParam = FlatDataWriterUtils.defaultOptions }) => {
  const options = { ...FlatDataWriterUtils.defaultOptions, ...optionsParam }
  const { objectTransformer = null } = options
  const transform = objectTransformer || _transformObj(options)
  const opts = { fields, transforms: [transform] }
  const transformOpts = {
    objectMode: true,
    highWaterMark: 512,
  }
  return new Transform(opts, transformOpts)
}

export const writeItemsToStream = ({
  items,
  fields = null,
  options = FlatDataWriterUtils.defaultOptions,
  fileFormat = FileFormats.xlsx,
  outputStream,
}) =>
  fileFormat === FileFormats.csv
    ? CSVWriter.writeItemsToStream({ outputStream, items, fields, options })
    : ExcelWriter.writeItemsToStream({ outputStream, items, fields, options })
