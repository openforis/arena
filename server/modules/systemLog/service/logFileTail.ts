import { open, stat } from 'node:fs/promises'
import { StringDecoder } from 'node:string_decoder'

import { SystemLogResetReason, SystemLogResetReasons } from '@common/systemLog/systemLogConstants'

const NEWLINE = 0x0a
const readChunkSize = 64 * 1024
const defaultMaxBytesBackwards = 5 * 1024 * 1024
const defaultMaxBytesPerRead = 1024 * 1024
const defaultPollIntervalMs = 1000

type FileInfo = { size: number; ino: number }

export type LastLinesResult = {
  exists: boolean
  lines: string[]
  // offset where tailing must continue: end of the last complete line
  offset: number
  ino: number | null
  // true when the byte limit was reached before collecting maxLines lines
  truncated: boolean
}

const statOrNull = async (filePath: string): Promise<FileInfo | null> => {
  try {
    const { size, ino } = await stat(filePath)
    return { size, ino }
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

const readBytes = async (filePath: string, position: number, length: number): Promise<Buffer> => {
  const handle = await open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(length)
    const { bytesRead } = await handle.read(buffer, 0, length, position)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

const countNewlines = (buffer: Buffer): number => {
  let count = 0
  for (const byte of buffer) {
    if (byte === NEWLINE) count += 1
  }
  return count
}

const splitLines = (text: string): string[] => text.split('\n').map((line) => line.replace(/\r$/, ''))

/**
 * Reads the last complete lines of a file, reading it backwards in chunks so that memory usage is bounded.
 * @param {object} params - The parameters.
 * @param {string} params.filePath - Path of the file.
 * @param {number} params.maxLines - Maximum number of lines to return.
 * @param {number} [params.maxBytes] - Maximum number of bytes to read.
 * @returns {Promise<LastLinesResult>} - The lines and the offset where tailing must continue.
 */
export const readLastLines = async ({
  filePath,
  maxLines,
  maxBytes = defaultMaxBytesBackwards,
}: {
  filePath: string
  maxLines: number
  maxBytes?: number
}): Promise<LastLinesResult> => {
  const info = await statOrNull(filePath)
  if (!info) return { exists: false, lines: [], offset: 0, ino: null, truncated: false }

  const { size, ino } = info
  const chunks: Buffer[] = []
  let position = size
  let newlinesCount = 0
  // maxLines + 1 newlines guarantee that the first of the last maxLines lines is complete
  while (position > 0 && newlinesCount <= maxLines && size - position < maxBytes) {
    const length = Math.min(readChunkSize, position, maxBytes - (size - position))
    position -= length
    const chunk = await readBytes(filePath, position, length)
    chunks.unshift(chunk)
    newlinesCount += countNewlines(chunk)
  }
  const buffer = Buffer.concat(chunks)
  // bytes after the last newline belong to a line still being written: tailing will read them
  const end = buffer.lastIndexOf(NEWLINE) + 1
  // when the start of the file was not reached, the first line can be incomplete: skip it
  const start = position > 0 ? buffer.indexOf(NEWLINE) + 1 : 0
  const offset = position + end
  if (end <= start) {
    return { exists: true, lines: [], offset, ino, truncated: position > 0 }
  }
  const allLines = splitLines(buffer.subarray(start, end - 1).toString('utf8'))
  const lines = allLines.slice(-maxLines)
  const truncated = position > 0 && lines.length < maxLines
  return { exists: true, lines, offset, ino, truncated }
}

export type LogFileTailOptions = {
  filePath: string
  offset?: number
  ino?: number | null
  pollIntervalMs?: number
  maxBytesPerRead?: number
  onLines: (lines: string[]) => void
  onReset: (reason: SystemLogResetReason) => void
  onError: (error: Error) => void
}

/**
 * Follows a file (like `tail -f`), polling its size and notifying the complete lines appended to it.
 * Handles rotation (inode change or truncation) and partial lines.
 */
export class LogFileTail {
  private readonly filePath: string
  private readonly pollIntervalMs: number
  private readonly maxBytesPerRead: number
  private readonly onLines: (lines: string[]) => void
  private readonly onReset: (reason: SystemLogResetReason) => void
  private readonly onError: (error: Error) => void
  private offset: number
  private ino: number | null
  private pending = ''
  private skipFirstLine = false
  private decoder = new StringDecoder('utf8')
  private timeout: NodeJS.Timeout | null = null
  private stopped = true

  constructor(options: LogFileTailOptions) {
    const {
      filePath,
      offset = 0,
      ino = null,
      pollIntervalMs = defaultPollIntervalMs,
      maxBytesPerRead = defaultMaxBytesPerRead,
      onLines,
      onReset,
      onError,
    } = options
    this.filePath = filePath
    this.offset = offset
    this.ino = ino
    this.pollIntervalMs = pollIntervalMs
    this.maxBytesPerRead = maxBytesPerRead
    this.onLines = onLines
    this.onReset = onReset
    this.onError = onError
  }

  start(): void {
    this.stopped = false
    this.scheduleNextPoll()
  }

  stop(): void {
    this.stopped = true
    if (this.timeout) clearTimeout(this.timeout)
    this.timeout = null
  }

  /**
   * Reads what has been appended since the last poll; exposed to let tests poll synchronously.
   * @returns {Promise<void>} - Resolved when the new content has been notified.
   */
  async poll(): Promise<void> {
    const info = await statOrNull(this.filePath)
    // file missing (e.g. being rotated or not created yet): wait for it
    if (!info) return

    const { size, ino } = info
    if ((this.ino !== null && ino !== this.ino) || size < this.offset) {
      this.restart({ offset: 0, reason: SystemLogResetReasons.rotated })
    }
    this.ino = ino
    if (size <= this.offset) return

    if (size - this.offset > this.maxBytesPerRead) {
      this.restart({ offset: size - this.maxBytesPerRead, reason: SystemLogResetReasons.skipped })
      this.skipFirstLine = true
    }
    const buffer = await readBytes(this.filePath, this.offset, size - this.offset)
    this.offset += buffer.length
    this.notifyText(this.decoder.write(buffer))
  }

  private restart({ offset, reason }: { offset: number; reason: SystemLogResetReason }): void {
    this.offset = offset
    this.pending = ''
    this.skipFirstLine = false
    this.decoder = new StringDecoder('utf8')
    this.onReset(reason)
  }

  private notifyText(text: string): void {
    const lines = splitLines(this.pending + text)
    // the last element is an incomplete line (empty when the text ends with a newline)
    this.pending = lines.pop() ?? ''
    if (this.skipFirstLine && lines.length > 0) {
      lines.shift()
      this.skipFirstLine = false
    }
    if (lines.length > 0) {
      this.onLines(lines)
    }
  }

  private scheduleNextPoll(): void {
    if (this.stopped) return
    this.timeout = setTimeout(async () => {
      try {
        await this.poll()
      } catch (error) {
        this.onError(error)
      }
      this.scheduleNextPoll()
    }, this.pollIntervalMs)
  }
}
