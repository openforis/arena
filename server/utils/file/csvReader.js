import { parse as csvParser } from 'csv'

import { SystemError } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as FileUtils from './fileUtils'

const _extractValidHeaders = (row) => {
  // remove last empty columns
  const headers = []
  let nonEmptyHeaderFound = false
  for (let index = row.length - 1; index >= 0; index--) {
    const header = StringUtils.trim(row[index])

    if (StringUtils.isBlank(header)) {
      if (nonEmptyHeaderFound) {
        throw new SystemError('appErrors.csv.emptyHeaderFound', { columnPosition: index + 1 })
      }
    } else {
      nonEmptyHeaderFound = true
      headers.unshift(header)
    }
  }
  if (!nonEmptyHeaderFound) {
    throw new SystemError('appErrors.csv.emptyHeadersFound')
  }
  return headers
}

export const createReaderFromStream = (stream, onHeaders = null, onRow = null, onTotalChange = null) => {
  const jobStatus = { canceled: false }

  const _tryOrCancel = async (fnPromise) => {
    try {
      await fnPromise
    } catch (error) {
      cancel()
      throw error
    }
  }

  const parser = stream.pipe(
    csvParser({ relaxColumnCount: true, skip_empty_lines: true, skip_records_with_empty_values: true })
  )

  const start = async () => {
    let headers = null
    let total = 0

    const _indexRowByHeaders = (row) =>
      headers
        ? headers.reduce(
            (accRow, header, index) =>
              Object.assign(accRow, {
                [header]: StringUtils.trim(row[index]),
              }),
            {}
          )
        : row

    const _processRow = async (row) => {
      // Skip first row (headers)
      if (total++ > 0 && onTotalChange) {
        onTotalChange(total)
      }
      if (headers) {
        // Headers have been read, process row
        if (onRow) await _tryOrCancel(onRow(_indexRowByHeaders(row)))
      } else {
        // Process headers
        headers = _extractValidHeaders(row)
        if (onHeaders) await _tryOrCancel(onHeaders(headers))
      }
    }

    for await (const row of parser) {
      if (jobStatus.canceled) {
        break
      } else {
        await _processRow(row)
      }
    }
  }

  const cancel = () => {
    jobStatus.canceled = true
    stream?.destroy()
  }

  return { start, cancel }
}

export const createReaderFromFile = (filePath, onHeaders = null, onRow = null, onTotalChange = null) =>
  createReaderFromStream(FileUtils.createReadStream(filePath), onHeaders, onRow, onTotalChange)

export const readHeadersFromStream = async (stream) => {
  let result = []

  const reader = createReaderFromStream(stream, (headers) => {
    reader.cancel()
    result = headers
  })
  await reader.start()

  return result
}
