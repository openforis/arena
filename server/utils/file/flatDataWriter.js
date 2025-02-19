import { FileFormats } from '@core/fileFormats'

import * as CSVWriter from './csvWriter'
import * as ExcelWriter from './excelWriter'
import { FlatDataWriterUtils } from './flatDataWriterUtils'
import { StreamUtils } from '../streamUtils'

export const writeItemsToStream = ({
  items,
  fields = null,
  options = FlatDataWriterUtils.defaultOptions,
  fileFormat = FileFormats.csv,
  outputStream,
}) =>
  fileFormat === FileFormats.csv
    ? CSVWriter.writeItemsToStream({ outputStream, items, fields, options })
    : ExcelWriter.writeItemsToStream({ outputStream, items, fields, options })

export const writeItemsStreamToStream = async ({
  stream,
  outputStream,
  fields,
  options,
  fileFormat = FileFormats.csv,
}) => {
  if (fileFormat === FileFormats.csv) {
    return CSVWriter.pipeDataStreamToStream({ stream, fields, options, outputStream })
  }
  const items = await StreamUtils.readStreamToItems(stream)
  return writeItemsToStream({ items, fields, options, fileFormat, outputStream })
}
