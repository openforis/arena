import { parse as csvParser } from 'csv'
import * as fs from 'fs'

import Queue from '@core/queue'

export const createReaderFromStream = (stream, onHeaders = null, onRow = null, onTotalChange = null) => {

  let canceled = false
  const queue = new Queue()

  const start = () => new Promise((resolve, reject) => {
    let started = false
    let ended = false
    let headers = null
    let total = 0
    let processingHeaders = false
    let processingRow = false //prevents the call to processNext when a row is already being processed

    const processNext = () => {
      (async () => {
        if (queue.isEmpty()) {
          if (ended)
            resolve()
        } else if (!canceled) {
          const row = queue.dequeue()
          if (onRow) {
            processingRow = true
            try {
              await onRow(_indexRowByHeaders(row))
              processingRow = false
            } catch (e) {
              cancel()
              reject(e)
              return
            }
          }
          processNext()
        }
      })()
    }

    const onData = data => {
      if (canceled)
        return resolve()

      if (headers) {
        const wasEmpty = queue.isEmpty()
        queue.enqueue(data)
        onTotalChange && onTotalChange(++total)

        if (!processingHeaders && (!started || wasEmpty && !processingRow)) {
          started = true
          processNext()
        }
      } else {
        headers = data

        if (onHeaders) {
          (async () => {
            processingHeaders = true
            try {
              await onHeaders(headers)
            } catch (e) {
              cancel()
              reject(e)
              return
            }
            processingHeaders = false
            if (!processingRow && !queue.isEmpty())
              await processNext()
          })()
        }
      }
    }

    const onEnd = () => {
      ended = true
      if (queue.isEmpty())
        resolve()
    }

    const _indexRowByHeaders = row =>
      headers
        ? headers.reduce((accRow, header, index) => Object.assign(accRow, { [header]: row[index] }), {})
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

  return { start, cancel }
}

export const createReaderFromFile = (filePath, onHeaders = null, onRow = null, onTotalChange = null) =>
  createReaderFromStream(fs.createReadStream(filePath), onHeaders, onRow, onTotalChange)

export const readHeadersFromStream = async stream => {
  let result = []

  const reader = createReaderFromStream(
    stream,
    headers => {
      reader.cancel()
      result = headers
    }
  )
  await reader.start()

  return result
}
