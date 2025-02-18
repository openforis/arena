const readStreamToBuffer = async (stream) => {
  if (!stream) return null
  const chunks = []
  for await (const data of stream) {
    chunks.push(data)
  }
  return Buffer.concat(chunks)
}

const readStreamToItems = async (stream) => {
  const items = []
  await new Promise((resolve, reject) => {
    stream.on('data', (row) => {
      items.push(row)
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
