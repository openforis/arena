import { SystemLogMessage, SystemLogMessageTypes, SystemLogResetReasons } from '@common/systemLog/systemLogConstants'

import { LogFileTail, LogFileTailOptions, readLastLines } from './logFileTail'

// keeps each message (and so each cluster bus relay row) reasonably small
const linesPerMessage = 1000

export const chunkLines = (lines: string[], size: number = linesPerMessage): string[][] => {
  const chunks: string[][] = []
  for (let index = 0; index < lines.length; index += size) {
    chunks.push(lines.slice(index, index + size))
  }
  return chunks
}

/**
 * Keeps the most recent lines whose total size does not exceed maxBytes.
 * @param {string[]} lines - The lines.
 * @param {number} maxBytes - Maximum total size (in bytes).
 * @returns {{lines: string[], skipped: boolean}} - The kept lines and whether some lines were dropped.
 */
export const limitLinesBytes = (lines: string[], maxBytes: number): { lines: string[]; skipped: boolean } => {
  let bytes = 0
  let index = lines.length
  while (index > 0) {
    const lineBytes = Buffer.byteLength(lines[index - 1]) + 1
    if (bytes + lineBytes > maxBytes) break
    bytes += lineBytes
    index -= 1
  }
  return { lines: index === 0 ? lines : lines.slice(index), skipped: index > 0 }
}

export type LogFileTailOptionsSubset = Pick<LogFileTailOptions, 'pollIntervalMs' | 'maxBytesPerRead'>

export type LogFileStreamParams = {
  filePath: string
  fileName: string
  instanceId: string
  local: boolean
  maxLines: number
  // lines appended in a single poll exceeding this size are dropped (oldest first)
  maxBytesPerPoll?: number
  tailOptions?: LogFileTailOptionsSubset
  send: (message: SystemLogMessage) => void
  onError: (error: Error) => void
}

export type LogFileStream = { stop: () => void }

/**
 * Sends the last lines of a log file and then the lines appended to it.
 * @param {LogFileStreamParams} params - The parameters.
 * @returns {Promise<LogFileStream>} - The started stream.
 */
export const startLogFileStream = async (params: LogFileStreamParams): Promise<LogFileStream> => {
  const { filePath, fileName, instanceId, local, maxLines, maxBytesPerPoll, tailOptions, send, onError } = params

  const sendLines = (lines: string[]) => {
    for (const chunk of chunkLines(lines)) {
      send({ type: SystemLogMessageTypes.append, instanceId, lines: chunk })
    }
  }

  const { exists, lines, offset, ino, truncated } = await readLastLines({ filePath, maxLines })
  const [firstChunk = [], ...otherChunks] = chunkLines(lines)
  send({
    type: SystemLogMessageTypes.init,
    instanceId,
    local,
    fileName,
    fileExists: exists,
    lines: firstChunk,
    truncated,
  })
  sendLines(otherChunks.flat())

  const tail = new LogFileTail({
    ...tailOptions,
    filePath,
    offset,
    ino,
    onLines: (newLines) => {
      if (!maxBytesPerPoll) {
        sendLines(newLines)
        return
      }
      const { lines: limitedLines, skipped } = limitLinesBytes(newLines, maxBytesPerPoll)
      if (skipped) send({ type: SystemLogMessageTypes.reset, instanceId, reason: SystemLogResetReasons.skipped })
      sendLines(limitedLines)
    },
    onReset: (reason) => send({ type: SystemLogMessageTypes.reset, instanceId, reason }),
    onError: (error) => {
      tail.stop()
      onError(error)
    },
  })
  tail.start()

  return { stop: () => tail.stop() }
}
