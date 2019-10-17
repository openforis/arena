const csvParser = require('csv').parse
const fs = require('fs')

const Queue = require('../../../core/queue')

const createReaderFromStream = (stream, onHeaders = null, onRow = null, onTotalChange = null) => {

  let canceled = false
  const queue = new Queue()

  const start = () => new Promise((resolve, reject) => {
    let started = false
    let ended = false
    let headers = null
    let total = 0
    let processingRow = false //prevents the call to processNext when a row is already being processed

    const processNext = () => {
      if (queue.isEmpty()) {
        if (ended)
          resolve()
      } else if (!canceled) {
        if (onRow) {
          processingRow = true
          onRow(queue.dequeue())
            .then(() => {
              processNext()
            })
            .catch(e => {
              cancel()
              reject(e)
            })
            .finally(() => {
              processingRow = false
            })
        } else {
          processNext()
        }
      }
    }

    const onData = data => {
      if (canceled)
        return resolve()

      if (headers) {
        const wasEmpty = queue.isEmpty()
        queue.enqueue(data)
        onTotalChange && onTotalChange(++total)

        if (!started || wasEmpty && !processingRow) {
          started = true
          processNext()
        }
      } else {
        headers = data
        onHeaders && onHeaders(headers)
      }
    }

    const onEnd = () => {
      ended = true
      if (queue.isEmpty())
        resolve()
    }

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

const createReaderFromFile = (filePath, onHeaders = null, onRow = null, onTotalChange = null) =>
  createReaderFromStream(fs.createReadStream(filePath), onHeaders, onRow, onTotalChange)

const readHeadersFromStream = async stream => {
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

module.exports = {
  createReaderFromFile,
  createReaderFromStream,
  readHeadersFromStream,
}