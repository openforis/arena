import type { Readable, Writable } from 'node:stream'

import { FileFormats } from '@core/fileFormats'

import * as CSVWriter from './csvWriter'
import * as ExcelWriter from './excelWriter'
import { FlatDataWriterOptions, FlatDataWriterUtils } from './flatDataWriterUtils'
import type { CsvFieldItem } from './csvField'
import { StreamUtils } from '../streamUtils'

export const writeItemsToStream = ({
  items,
  fields = null,
  options = FlatDataWriterUtils.defaultOptions,
  fileFormat = FileFormats.csv,
  outputStream,
}: {
  items: Record<string, any>[]
  fields?: CsvFieldItem[] | null
  options?: FlatDataWriterOptions
  fileFormat?: string
  outputStream: Writable
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
  onData = null,
}: {
  stream: Readable
  outputStream: Writable
  fields?: CsvFieldItem[] | null
  options?: FlatDataWriterOptions
  fileFormat?: string
  onData?: ((row: Record<string, unknown>) => void) | null
}) => {
  if (fileFormat === FileFormats.csv) {
    return CSVWriter.pipeDataStreamToStream({ stream, fields, options, outputStream })
  }
  const items = await StreamUtils.readStreamToItems({ stream, onData })
  return writeItemsToStream({ items, fields, options, fileFormat, outputStream })
}
