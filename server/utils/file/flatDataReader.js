import { parse } from '@fast-csv/parse'

import { SystemError } from '@openforis/arena-core'

import { FileFormats } from '@core/fileFormats'
import * as StringUtils from '@core/stringUtils'

import * as FileUtils from './fileUtils'
import { ExcelReader } from './excelReader'

const _extractValidHeaders = (row) => {
  // remove last empty columns
  const headers = []
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

const _rowToObject = ({ headers, row }) => {
  const result = Object.create(null)
  for (let index = 0; index < headers.length; index++) {
    const header = headers[index]
    const cellValue = row[index]
    const trimmedCellValue = StringUtils.isString(cellValue) ? StringUtils.trim(cellValue) : cellValue
    result[header] = trimmedCellValue
  }
  return result
}

/**
 * Reads the rows of a flat data stream one at a time (CSV rows are not kept in memory).
 * @param {object} params - The parameters.
 * @param {object} params.stream - The readable stream.
 * @param {string} [params.fileFormat] - Format of the data (csv or xlsx).
 * @param {(headers: string[]) => void | Promise<void>} [params.onHeaders] - Called (and awaited) with the headers, before the first row is yielded.
 * @param {(total: number) => void} [params.onTotalChange] - Called when the total number of rows changes.
 * @yields {object} The rows, as objects indexed by header.
 */
export async function* generateRowsFromStream({
  stream,
  fileFormat = FileFormats.csv,
  onHeaders = null,
  onTotalChange = null,
}) {
  const csv = fileFormat === FileFormats.csv
  const rows = csv
    ? stream.pipe(parse({ ignoreEmpty: true }))
    : await ExcelReader.extractRowsFromExcelStream({ stream })
  if (onTotalChange && !csv) {
    onTotalChange(rows.length)
  }
  let headers = null
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

/**
 * Reads the rows of a flat data file one at a time (CSV rows are not kept in memory).
 * @param {object} params - The parameters.
 * @param {string} params.filePath - Path of the file.
 * @param {string} [params.fileFormat] - Format of the file (csv or xlsx).
 * @param {(headers: string[]) => void | Promise<void>} [params.onHeaders] - Called (and awaited) with the headers, before the first row is yielded.
 * @yields {object} The rows, as objects indexed by header.
 */
export async function* generateRowsFromFile({ filePath, fileFormat = FileFormats.csv, onHeaders = null }) {
  const stream = FileUtils.createReadStream(filePath)
  try {
    yield* generateRowsFromStream({ stream, fileFormat, onHeaders })
  } finally {
    stream.destroy()
  }
}

export const createReaderFromStream = ({
  stream,
  fileFormat = FileFormats.csv,
  onHeaders = null,
  onRow = null,
  onTotalChange = null,
}) => {
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

export const createReaderFromFile = ({ filePath, fileFormat, onHeaders = null, onRow = null, onTotalChange = null }) =>
  createReaderFromStream({ stream: FileUtils.createReadStream(filePath), fileFormat, onHeaders, onRow, onTotalChange })

export const readHeadersFromStream = async ({ stream, fileFormat = FileFormats.csv }) => {
  let result = []

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

export const calculateTotalRowsFromFile = async ({ filePath, fileFormat }) => {
  let result = 0
  const reader = createReaderFromFile({ filePath, fileFormat, onTotalChange: (total) => (result = total) })
  await reader.start()
  return result
}
