const csvParser = require('csv').parse
const fs = require('fs')

const Queue = require('../../../core/queue')

const createReaderFromStream = (stream, onHeaders = null, onRow = null, onTotalChange = null) => {

  let headers = null
  let total = 0
  let canceled = false
  const queue = new Queue()

  const start = () => new Promise((resolve, reject) => {
    let started = false
    let ended = false

    const processNext = () => {
      (async () => {
        if (queue.isEmpty()) {
          if (ended)
            resolve()
        } else if (!canceled) {
          onRow && await onRow(queue.dequeue())
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

        if (!started || wasEmpty) {
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