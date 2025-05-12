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

const readStreamToItems = async (stream, maxCellsLimit = defaultMaxCellsLimit) => {
  const items = []
  let cellsCount = 0
  await new Promise((resolve, reject) => {
    stream.on('data', (row) => {
      items.push(row)
      cellsCount += Object.keys(row)
      if (cellsCount === maxCellsLimit) {
        stream.destroy()
        reject(new SystemError(`dataExport.excelMaxCellsLimitExceeded`, { limit: maxCellsLimit }))
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
}
