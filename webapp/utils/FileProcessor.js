import { ProcessorWithTryings } from './ProcessorWithTryings'

export class FileProcessor {
  constructor({
    file,
    chunkProcessor,
    chunkSize = FileProcessor.defaultChunkSize,
    maxTryings = FileProcessor.defaultMaxTryings,
    onError,
  }) {
    this.file = file
    this.chunkProcessor = chunkProcessor
    this.chunkSize = chunkSize
    this.maxTryings = maxTryings
    this.onError = onError

    this._reset()
  }

  _reset() {
    this.running = false
    this.totalChunks = 0
    this.currentChunkNumber = 0
  }

  start(startFromChunk = 1) {
    this.running = true
    this.totalChunks = Math.ceil(this.file.size / this.chunkSize)
    this.currentChunkNumber = startFromChunk
    this._processNextChunk()
  }

  stop() {
    this._reset()
  }

  pause() {
    this.running = false
  }

  resume() {
    this.running = true
    this._processNextChunk()
  }

  onFail(error) {
    this.onError?.(error)
  }

  _processNextChunk() {
    const { file, chunkProcessor, currentChunkNumber, totalChunks, chunkSize, maxTryings } = this

    const content = file.slice(
      (currentChunkNumber - 1) * chunkSize,
      currentChunkNumber === totalChunks ? undefined : currentChunkNumber * chunkSize
    )

    const processorWithTryings = new ProcessorWithTryings({
      processor: async () => chunkProcessor({ chunk: currentChunkNumber, totalChunks, content }),
      onSuccess: () => {
        if (this.running && this.currentChunkNumber < totalChunks) {
          this.currentChunkNumber += 1
          this._processNextChunk()
        }
      },
      onFail: (error) => {
        this.onFail(new Error('Cannot process file chunk', error))
      },
      maxTryings,
    })
    processorWithTryings.start()
  }
}

FileProcessor.defaultChunkSize = 1024 * 1024 * 10 // 10MB
FileProcessor.defaultMaxTryings = 5
