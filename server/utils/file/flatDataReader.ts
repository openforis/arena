import type { Readable } from 'node:stream'
import { parse } from '@fast-csv/parse'

import { SystemError } from '@openforis/arena-core'

import { FileFormats } from '@core/fileFormats'
import * as StringUtils from '@core/stringUtils'

import * as FileUtils from './fileUtils'
import { ExcelReader } from './excelReader'

type Row = Record<string, any>
type HeadersListener = ((headers: string[]) => void | Promise<void>) | null
type TotalChangeListener = ((total: number) => void) | null

const _extractValidHeaders = (row: unknown[]): string[] => {
  // remove last empty columns
  const headers: string[] = []
  let nonEmptyHeaderFound = false
  for (let index = row.length - 1; index >= 0; index--) {
    const header = StringUtils.trim(row[index])

    if (StringUtils.isBlank(header)) {
      if (nonEmptyHeaderFound) {
        throw new SystemError('appErrors:csv.emptyHeaderFound', { columnPosition: index + 1 })
      }
    } else {
      nonEmptyHeaderFound = true
      headers.unshift(header)
    }
  }
  if (!nonEmptyHeaderFound) {
    throw new SystemError('appErrors:csv.emptyHeadersFound')
  }
  return headers
}

const _rowToObject = ({ headers, row }: { headers: string[]; row: unknown[] }): Row => {
  const result = Object.create(null)
  for (let index = 0; index < headers.length; index++) {
    const header = headers[index]
    const cellValue = row[index]
    const trimmedCellValue = StringUtils.isString(cellValue) ? StringUtils.trim(cellValue) : cellValue
    result[header] = trimmedCellValue
  }
  return result
}

// reads the rows (objects indexed by header) of a flat data stream (csv or xlsx) one at a time (CSV rows are not kept
// in memory); onHeaders is called (and awaited) with the headers before the first row is yielded
export async function* generateRowsFromStream({
  stream,
  fileFormat = FileFormats.csv,
  onHeaders = null,
  onTotalChange = null,
}: {
  stream: Readable
  fileFormat?: string
  onHeaders?: HeadersListener
  onTotalChange?: TotalChangeListener
}): AsyncGenerator<Row> {
  const csv = fileFormat === FileFormats.csv
  const rows = csv
    ? stream.pipe(parse({ ignoreEmpty: true }))
    : await ExcelReader.extractRowsFromExcelStream({ stream })
  if (onTotalChange && !csv) {
    onTotalChange((rows as unknown[][]).length)
  }
  let headers: string[] | null = null
  let total = 0
  for await (const row of rows) {
    // Skip first row (headers)
    if (onTotalChange && csv && total++ > 0) {
      onTotalChange(total)
    }
    if (headers) {
      yield _rowToObject({ headers, row })
    } else {
      headers = _extractValidHeaders(row)
      if (onHeaders) await onHeaders(headers)
    }
  }
}

// reads the rows of a flat data file one at a time (see generateRowsFromStream)
export async function* generateRowsFromFile({
  filePath,
  fileFormat = FileFormats.csv,
  onHeaders = null,
}: {
  filePath: string
  fileFormat?: string
  onHeaders?: HeadersListener
}): AsyncGenerator<Row> {
  const stream = FileUtils.createReadStream(filePath)
  try {
    yield* generateRowsFromStream({ stream, fileFormat, onHeaders })
  } finally {
    stream.destroy()
  }
}

type ReaderParams = {
  fileFormat?: string
  onHeaders?: HeadersListener
  onRow?: ((row: Row) => unknown) | null
  onTotalChange?: TotalChangeListener
}

export type FlatDataReader = { start: () => Promise<void>; cancel: () => void }

// reader of the rows of a stream (csv or xlsx)
export const createReaderFromStream = ({
  stream,
  fileFormat = FileFormats.csv,
  onHeaders = null,
  onRow = null,
  onTotalChange = null,
}: ReaderParams & { stream: Readable }): FlatDataReader => {
  const readerStatus = { canceled: false }

  const cancel = () => {
    readerStatus.canceled = true
    stream?.destroy()
  }

  const start = async () => {
    // a destroyed stream would never end
    if (readerStatus.canceled) return

    try {
      for await (const row of generateRowsFromStream({ stream, fileFormat, onHeaders, onTotalChange })) {
        if (readerStatus.canceled) break
        if (onRow) await onRow(row)
      }
    } catch (error) {
      cancel()
      throw error
    }
  }

  return { start, cancel }
}

export const createReaderFromFile = ({
  filePath,
  fileFormat,
  onHeaders = null,
  onRow = null,
  onTotalChange = null,
}: ReaderParams & { filePath: string }): FlatDataReader =>
  createReaderFromStream({ stream: FileUtils.createReadStream(filePath), fileFormat, onHeaders, onRow, onTotalChange })

export const readHeadersFromStream = async ({
  stream,
  fileFormat = FileFormats.csv,
}: {
  stream: Readable
  fileFormat?: string
}): Promise<string[]> => {
  let result: string[] = []

  const reader = createReaderFromStream({
    stream,
    fileFormat,
    onHeaders: (headers) => {
      reader.cancel()
      result = headers
    },
  })
  await reader.start()

  return result
}

export const calculateTotalRowsFromFile = async ({
  filePath,
  fileFormat,
}: {
  filePath: string
  fileFormat?: string
}): Promise<number> => {
  let result = 0
  const reader = createReaderFromFile({ filePath, fileFormat, onTotalChange: (total) => (result = total) })
  await reader.start()
  return result
}
