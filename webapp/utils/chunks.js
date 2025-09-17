const onUploadProgress =
  ({ totalChunks, chunk, onUploadProgress }) =>
  (progressEvent) => {
    const { progress: chunkProgress } = progressEvent
    const completedChunksCount = chunk - 1
    const completedChunks = completedChunksCount + chunkProgress
    onUploadProgress({ total: totalChunks, loaded: completedChunks })
  }

export const Chunks = {
  onUploadProgress,
}
