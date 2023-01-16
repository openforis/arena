import { parse as csvParser } from 'csv'

import { SystemError } from '@openforis/arena-core'

import Queue from '@core/queue'
import * as StringUtils from '@core/stringUtils'
import * as FileUtils from './fileUtils'

export const createReaderFromStream = (stream, onHeaders = null, onRow = null, onTotalChange = null) => {
  const jobStatus = { canceled: false }

  const start = () =>
    new Promise((resolve, reject) => {
      const queue = new Queue()
      let headers = null
      let total = 0

      // Executes the specified function fn in a try catch.
      // Cancels the execution and calls "reject" if the execution of the speciied function throws an error.
      const _tryOrCancel = async (fnPromise) => {
        try {
          await fnPromise
        } catch (error) {
          cancel()
          reject(error)
        }
      }

      const _extractValidHeaders = (row) => {
        // remove last empty columns
        const _headers = []
        let nonEmptyHeaderFound = false
        for (let index = row.length - 1; index >= 0; index--) {
          const header = StringUtils.trim(row[index])

          if (StringUtils.isBlank(header)) {
            if (nonEmptyHeaderFound) {
              reject(new SystemError('appErrors.csv.emptyHeaderFound', { columnPosition: index + 1 }))
              break
            }
          } else {
            nonEmptyHeaderFound = true
            _headers.unshift(header)
          }
        }
        if (!nonEmptyHeaderFound) {
          reject(new SystemError('appErrors.csv.emptyHeadersFound'))
        }
        return _headers
      }

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

      const processQueue = () => {
        ;(async () => {
          let row
          // Run until there's a row in the queue and it's not been canceled
          while ((row = queue.dequeue()) && !jobStatus.canceled) {
            if (headers) {
              // Headers have been read, process row
              if (onRow) await _tryOrCancel(onRow(_indexRowByHeaders(row)))
            } else {
              // Process headers
              headers = _extractValidHeaders(row)
              if (onHeaders) await _tryOrCancel(onHeaders(headers))
            }
          }

          return resolve()
        })()
      }

      const onData = (data) => {
        if (jobStatus.canceled) return resolve()

        // Skip first row (headers)
        if (total++ > 0 && onTotalChange) onTotalChange(total)

        queue.enqueue(data)
      }

      const onEnd = () => {
        if (queue.isEmpty()) resolve()
        else processQueue()
      }

      stream
        .pipe(csvParser({ relaxColumnCount: true, skip_empty_lines: true, skip_records_with_empty_values: true }))
        .on('data', onData)
        .on('end', onEnd)
        .on('error', reject)
    })

  const cancel = () => {
    jobStatus.canceled = true
    if (stream) stream.destroy()
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
