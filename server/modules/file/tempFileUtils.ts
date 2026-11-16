export const getChunkFileName = ({ fileId, chunk }: { fileId: string; chunk: any }) => `${fileId}_part${chunk}`
