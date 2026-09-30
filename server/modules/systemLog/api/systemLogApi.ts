import { ApiAuthMiddleware, ClusterBus, ProcessEnv } from '@openforis/arena-server'

import { SystemLogConstants, SystemLogMessage } from '@common/systemLog/systemLogConstants'

import * as Log from '@server/log/log'
import * as Request from '@server/utils/request'
import { createSseEventWriter, openSseStream } from '@server/modules/ai/api/serverSentEvents'

import { SystemLogClusterRelay } from '../service/systemLogClusterRelay'
import { startSystemLogStreamSession } from '../service/systemLogStreamSession'

const logger = Log.getLogger('SystemLogApi')

// keeps proxies (e.g. Heroku, 55s idle timeout) from closing the stream
const heartbeatIntervalMs = 20000

// tails this instance's log file for the log streams served by the other instances
const relay = new SystemLogClusterRelay({
  bus: ClusterBus,
  instanceId: ProcessEnv.instanceId,
  getFilePath: Log.getLogFilePath,
  fileName: Log.LOG_FILE_NAME,
  onError: (error) => logger.error(`error relaying log file: ${error.message}`),
})

const parseMaxLines = (value: unknown): number => {
  const maxLines = Number(value)
  if (!Number.isFinite(maxLines) || maxLines <= 0) return SystemLogConstants.defaultMaxLines
  return Math.min(Math.floor(maxLines), SystemLogConstants.maxLinesLimit)
}

/**
 * Streams the last lines of the log files of all the server instances and then the lines appended to them
 * (like `tail -f`), until the client disconnects.
 * @param {object} params - The parameters.
 * @param {object} params.res - The Express response.
 * @param {number} params.maxLines - Number of lines sent initially for every instance.
 * @returns {Promise<void>} - Resolved once the stream is started.
 */
const streamLogFiles = async ({ res, maxLines }): Promise<void> => {
  openSseStream(res)
  const writeEvent = createSseEventWriter(res)

  const session = await startSystemLogStreamSession({
    relay,
    filePath: Log.getLogFilePath(),
    fileName: Log.LOG_FILE_NAME,
    instanceId: ProcessEnv.instanceId,
    maxLines,
    send: (message: SystemLogMessage) => writeEvent({ chunk: message }),
    onError: (error) => {
      logger.error(`error reading log file: ${error.message}`)
      writeEvent({ error: error.message })
      res.end()
    },
  })
  const heartbeat = setInterval(() => res.write(': ping\n\n'), heartbeatIntervalMs)

  const stop = () => {
    session.stop()
    clearInterval(heartbeat)
  }
  // client already gone: its 'close' event would not be received
  if (res.destroyed) stop()
  else res.on('close', stop)
}

export const init = (app) => {
  app.get('/admin/logs/stream', ApiAuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const { maxLines } = Request.getParams(req)
      await streamLogFiles({ res, maxLines: parseMaxLines(maxLines) })
    } catch (error) {
      next(error)
    }
  })
}
