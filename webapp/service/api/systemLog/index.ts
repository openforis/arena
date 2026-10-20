import { SystemLogMessage } from '@common/systemLog/systemLogConstants'

import { streamSse } from '@webapp/service/api/ai/streaming'

type StreamSystemLogParams = {
  maxLines: number
  onMessage: (message: SystemLogMessage) => void
  onError: (error: Error) => void
  onDone: () => void
}

/**
 * Opens the server log stream: last `maxLines` lines first, then the lines appended to the log file.
 * @param {StreamSystemLogParams} params - The parameters.
 * @returns {Function} - Function that closes the stream.
 */
export const streamSystemLog = ({ maxLines, onMessage, onError, onDone }: StreamSystemLogParams): (() => void) =>
  streamSse(`/api/admin/logs/stream?maxLines=${maxLines}`, {
    onChunk: onMessage,
    onError,
    onDone,
  }) as () => void
