export const getChunkFileName = ({ fileId, chunk }: { fileId: string; chunk: number }) => `${fileId}_part${chunk}`
