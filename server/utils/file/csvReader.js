const csvParser = require('csv').parse
const fs = require('fs')

const Queue = require('../../../common/queue')

const createReader = (filePath, onHeaders, onRow, onTotalChange) => {

  let headers = null
  let total = 0
  let canceled = false
  let stream = null
  const queue = new Queue()

  const start = () => new Promise((resolve, reject) => {
    stream = fs.createReadStream(filePath)
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

    stream
      .pipe(csvParser())
      .on('data', onData)
      .on('end', () => ended = true)
      .on('error', reject)
  })

  const cancel = () => {
    canceled = true
    stream && stream.destroy()
  }

  return { start, cancel }
}

module.exports = {
  createReader
}