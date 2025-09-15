import { ProcessorWithTryings } from './ProcessorWithTryings'

export class FileProcessor {
  constructor({
    file,
    chunkProcessor,
    chunkSize = FileProcessor.defaultChunkSize,
    maxTryings = FileProcessor.defaultMaxTryings,
  }) {
    this.file = file
    this.chunkProcessor = chunkProcessor
    this.chunkSize = chunkSize
    this.maxTryings = maxTryings

    this.running = false
    this.currentChunkNumber = 0
    this.totalChunks = 0
  }

  start() {
    this.running = true
    this.totalChunks = Math.ceil(this.file.size / this.chunkSize)
    this._processNextChunk()
  }

  stop() {
    this.running = false
  }

  _processNextChunk() {
    this.currentChunkNumber += 1

    const { file, chunkProcessor, currentChunkNumber, totalChunks, chunkSize, maxTryings } = this

    const content = file.slice(
      (currentChunkNumber - 1) * chunkSize,
      currentChunkNumber === totalChunks ? undefined : currentChunkNumber * chunkSize
    )

    const processorWithTryings = new ProcessorWithTryings({
      processor: async () => chunkProcessor({ chunk: currentChunkNumber, totalChunks, content }),
      onSuccess: () => {
        if (this.running && this.currentChunkNumber < totalChunks) {
          this._processNextChunk()
        }
      },
      onFail: (error) => {
        throw new Error('Cannot process file chunk', error)
      },
      maxTryings,
    })
    processorWithTryings.start()
  }
}

FileProcessor.defaultChunkSize = 1024 * 1
FileProcessor.defaultMaxTryings = 1
