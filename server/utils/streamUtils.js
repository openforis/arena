import { SystemError } from '@openforis/arena-core'

const defaultMaxCellsLimit = 1000000

const readStreamToBuffer = async (stream) => {
  if (!stream) return null
  const chunks = []
  for await (const data of stream) {
    chunks.push(data)
  }
  return Buffer.concat(chunks)
}

const waitForStreamClose = async (stream) =>
  new Promise((resolve, reject) => {
    const onClose = () => {
      stream.off('error', onError)
      resolve()
    }
    const onError = (error) => {
      stream.off('close', onClose)
      reject(error)
    }
    stream.once('close', onClose)
    stream.once('error', onError)
  })

const waitForWritableStreamComplete = async (stream) =>
  new Promise((resolve, reject) => {
    const cleanup = () => {
      stream.off('finish', onFinish)
      stream.off('close', onClose)
      stream.off('error', onError)
    }
    const resolveOnce = () => {
      cleanup()
      resolve()
    }
    const onFinish = () => resolveOnce()
    const onClose = () => resolveOnce()
    const onError = (error) => {
      cleanup()
      reject(error)
    }
    stream.once('finish', onFinish)
    stream.once('close', onClose)
    stream.once('error', onError)
  })

const readStreamToItems = async ({ stream, maxCellsLimit = defaultMaxCellsLimit, onData = null }) => {
  const items = []
  let cellsCount = 0
  await new Promise((resolve, reject) => {
    stream.on('data', (row) => {
      if (onData) {
        // when a onData callback is specified, pause the strem and give time to the callback process
        stream.pause()
        onData(row)
      }
      items.push(row)
      cellsCount += Object.keys(row)
      if (cellsCount === maxCellsLimit) {
        stream.destroy()
        reject(new SystemError(`dataExport.excelMaxCellsLimitExceeded`, { limit: maxCellsLimit }))
      } else if (onData) {
        // onData callback specified: stream was paused, resume it
        setTimeout(() => {
          stream.resume()
        }, 1)
      }
    })
    stream.on('end', () => resolve(items))
    stream.on('error', (err) => reject(err))
  })
  return items
}

export const StreamUtils = {
  defaultMaxCellsLimit,
  readStreamToBuffer,
  readStreamToItems,
  waitForStreamClose,
  waitForWritableStreamComplete,
}
