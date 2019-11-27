import * as fs from 'fs'
import {parse as csvParser} from 'csv'

import Queue from '@core/queue'
import * as StringUtils from '@core/stringUtils'

export const createReaderFromStream = (
  stream,
  onHeaders = null,
  onRow = null,
  onTotalChange = null,
) => {
  let canceled = false
  const queue = new Queue()

  const start = () =>
    new Promise((resolve, reject) => {
      let ended = false
      let headers = null
      let total = 0
      let processingRow = false // Prevents the call to processNext when a row is already being processed

      /**
       * Executes the specified function fn in a try catch.
       * Calls "reject" if the execution throws an error.
       */
      const _tryOrCancel = async fn => {
        try {
          await fn()
        } catch (error) {
          cancel()
          reject(error)
        }
      }

      const processNext = () => {
        ;(async () => {
          processingRow = true

          if (queue.isEmpty()) {
            if (ended) {
              resolve()
            }
          } else if (!canceled) {
            const row = queue.dequeue()

            if (headers) {
              // Headers read, process rows
              if (onRow) {
                await _tryOrCancel(async () => {
                  await onRow(_indexRowByHeaders(row))
                })
              }
            } else {
              // Process headers
              headers = row
              if (onHeaders) {
                await _tryOrCancel(async () => {
                  await onHeaders(headers)
                })
              }
            }

            processNext()
          }

          processingRow = false
        })()
      }

      const onData = data => {
        if (canceled) {
          return resolve()
        }

        ++total
        if (total > 0) {
          // Skip first row (headers)
          onTotalChange && onTotalChange(total)
        }

        const wasEmpty = queue.isEmpty()
        queue.enqueue(data)
        if (!processingRow && wasEmpty) {
          processNext()
        }
      }

      const onEnd = () => {
        ended = true
        if (queue.isEmpty()) {
          resolve()
        }
      }

      const _indexRowByHeaders = row =>
        headers
          ? headers.reduce(
              (accRow, header, index) =>
                Object.assign(accRow, {[header]: StringUtils.trim(row[index])}),
              {},
            )
          : row

      stream
        .pipe(csvParser())
        .on('data', onData)
        .on('end', onEnd)
        .on('error', reject)
    })

  const cancel = () => {
    canceled = true
    stream && stream.destroy()
  }

  return {start, cancel}
}

export const createReaderFromFile = (
  filePath,
  onHeaders = null,
  onRow = null,
  onTotalChange = null,
) =>
  createReaderFromStream(
    fs.createReadStream(filePath),
    onHeaders,
    onRow,
    onTotalChange,
  )

export const readHeadersFromStream = async stream => {
  let result = []

  const reader = createReaderFromStream(stream, headers => {
    reader.cancel()
    result = headers
  })
  await reader.start()

  return result
}
