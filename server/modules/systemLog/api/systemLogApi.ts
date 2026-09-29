import { ApiAuthMiddleware, ProcessEnv } from '@openforis/arena-server'

import { SystemLogConstants, SystemLogMessage, SystemLogMessageTypes } from '@common/systemLog/systemLogConstants'

import * as Log from '@server/log/log'
import * as Request from '@server/utils/request'
import { createSseEventWriter, openSseStream } from '@server/modules/ai/api/serverSentEvents'

import { LogFileTail, readLastLines } from '../service/logFileTail'

const logger = Log.getLogger('SystemLogApi')

// keeps proxies (e.g. Heroku, 55s idle timeout) from closing the stream
const heartbeatIntervalMs = 20000

const parseMaxLines = (value: unknown): number => {
  const maxLines = Number(value)
  if (!Number.isFinite(maxLines) || maxLines <= 0) return SystemLogConstants.defaultMaxLines
  return Math.min(Math.floor(maxLines), SystemLogConstants.maxLinesLimit)
}

/**
 * Streams the last lines of the server log file and then the lines appended to it (like `tail -f`),
 * until the client disconnects.
 * @param {object} params - The parameters.
 * @param {object} params.res - The Express response.
 * @param {number} params.maxLines - Number of lines sent initially.
 * @returns {Promise<void>} - Resolved once the initial lines are sent.
 */
const streamLogFile = async ({ res, maxLines }): Promise<void> => {
  const filePath = Log.getLogFilePath()
  const { exists, lines, offset, ino, truncated } = await readLastLines({ filePath, maxLines })
  // client already gone: its 'close' event would not be received
  if (res.destroyed) return

  openSseStream(res)
  const writeEvent = createSseEventWriter(res)
  const writeMessage = (message: SystemLogMessage) => writeEvent({ chunk: message })

  writeMessage({
    type: SystemLogMessageTypes.init,
    instanceId: ProcessEnv.instanceId,
    fileName: Log.LOG_FILE_NAME,
    fileExists: exists,
    lines,
    truncated,
  })

  const heartbeat = setInterval(() => res.write(': ping\n\n'), heartbeatIntervalMs)

  const tail = new LogFileTail({
    filePath,
    offset,
    ino,
    onLines: (newLines) => writeMessage({ type: SystemLogMessageTypes.append, lines: newLines }),
    onReset: (reason) => writeMessage({ type: SystemLogMessageTypes.reset, reason }),
    onError: (error) => {
      logger.error(`error reading log file: ${error.message}`)
      writeEvent({ error: error.message })
      res.end()
    },
  })

  res.on('close', () => {
    tail.stop()
    clearInterval(heartbeat)
  })

  tail.start()
}

export const init = (app) => {
  app.get('/admin/logs/stream', ApiAuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const { maxLines } = Request.getParams(req)
      await streamLogFile({ res, maxLines: parseMaxLines(maxLines) })
    } catch (error) {
      next(error)
    }
  })
}
