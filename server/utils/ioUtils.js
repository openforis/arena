import { once } from 'node:stream'

export const writeStreamAndWaitForEnd = async ({ writeStream, chunkFileContent }) =>
  new Promise((resolve, reject) => {
    writeStream.once('error', reject)
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

export const writeReadableToWritable = async ({ readStream, writeStream }) => {
  for await (const chunk of readStream) {
    if (!writeStream.write(chunk)) {
      await once(writeStream, 'drain')
    }
  }
}
