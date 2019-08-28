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

    const processNext = () => {
      (async () => {
        if (queue.isEmpty()) {
          resolve()
        } else if (!canceled) {
          await onRow(queue.dequeue())
          processNext()
        }
      })()
    }

    const onData = data => {
      if (headers) {
        queue.enqueue(data)
        onTotalChange(++total)

        if (!started) {
          started = true
          processNext()
        }
      } else {
        headers = data
        onHeaders(headers)
      }
    }

    stream
      .pipe(csvParser())
      .on('data', onData)
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