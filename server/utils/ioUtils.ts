import type { Readable, Writable } from 'node:stream'
import { once } from 'node:stream'

export const writeStreamAndWaitForEnd = async ({
  writeStream,
  chunkFileContent,
}: {
  writeStream: Writable
  chunkFileContent: string | Buffer
}): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    writeStream.once('error', reject)
    writeStream.write(chunkFileContent, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })

export const endWriteStream = async (writeStream: Writable): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    writeStream.on('error', reject)
    writeStream.on('finish', resolve)
    writeStream.end()
  })

export const writeReadableToWritable = async ({
  readStream,
  writeStream,
}: {
  readStream: Readable | AsyncIterable<unknown>
  writeStream: Writable
}): Promise<void> => {
  for await (const chunk of readStream) {
    if (!writeStream.write(chunk)) {
      await once(writeStream, 'drain')
    }
  }
}
