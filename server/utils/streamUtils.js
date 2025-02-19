const readStreamToBuffer = async (stream) => {
  if (!stream) return null
  const chunks = []
  for await (const data of stream) {
    chunks.push(data)
  }
  return Buffer.concat(chunks)
}

const readStreamToItems = async (stream, limit = 10000) => {
  const items = []
  let count = 0
  await new Promise((resolve, reject) => {
    stream.on('data', (row) => {
      items.push(row)
      count++
      if (count === limit) {
        stream.destroy()
        reject(new Error(`Too many items to process (> ${limit}). Use CSV export instead.`))
      }
    })
    stream.on('end', () => resolve(items))
    stream.on('error', (err) => reject(err))
  })
  return items
}

export const StreamUtils = {
  readStreamToBuffer,
  readStreamToItems,
}
