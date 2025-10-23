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

const _rowToObject = ({ headers, row }) =>
  headers.reduce((acc, header, index) => {
    const cellValue = row[index]
    const trimmedCellValue = StringUtils.isString(cellValue) ? StringUtils.trim(cellValue) : cellValue
    acc[header] = trimmedCellValue
    return acc
  }, {})

export const createReaderFromStream = ({
  stream,
  fileFormat = FileFormats.csv,
  onHeaders = null,
  onRow = null,
  onTotalChange = null,
}) => {
  const readerStatus = { canceled: false }

  const _tryOrCancel = async (fnPromise) => {
    try {
      await fnPromise
    } catch (error) {
      cancel()
      throw error
    }
  }

  const parser = fileFormat === FileFormats.csv ? stream.pipe(parse({ ignoreEmpty: true })) : null

  const start = async () => {
    let headers = null
    let total = 0

    const _processRow = async (row) => {
      // Skip first row (headers)
      if (onTotalChange && fileFormat === FileFormats.csv && total++ > 0) {
        onTotalChange(total)
      }
      if (headers) {
        // Headers have been read, process row
        if (onRow) await _tryOrCancel(onRow(_rowToObject({ headers, row })))
      } else {
        // Process headers
        headers = _extractValidHeaders(row)
        if (onHeaders) await _tryOrCancel(onHeaders(headers))
      }
    }

    const parserOrRows =
      fileFormat === FileFormats.csv ? parser : await ExcelReader.extractRowsFromExcelStream({ stream })

    if (onTotalChange && fileFormat === FileFormats.xlsx) {
      onTotalChange(parserOrRows.length)
    }
    for await (const row of parserOrRows) {
      if (readerStatus.canceled) {
        break
      } else {
        await _processRow(row)
      }
    }
  }

  const cancel = () => {
    readerStatus.canceled = true
    stream?.destroy()
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
