export const writeStreamAndWaitForEnd = async ({ writeStream, chunkFileContent }) =>
  new Promise((resolve, reject) => {
    writeStream.on('error', reject)
    writeStream.write(chunkFileContent, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })

export const endWriteStream = async (writeStream) =>
  new Promise((resolve, reject) => {
    writeStream.on('error', reject)
    writeStream.on('finish', resolve)
    writeStream.end()
  })
