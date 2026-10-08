import type { NextFunction, Request, Response } from 'express'

import { SystemError as CoreSystemError } from '@openforis/arena-core'

import SystemError from '@core/systemError'

import * as Log from '@server/log/log'
import * as ResponseUtils from '@server/utils/response'

const logger = Log.getLogger('SystemErrorMiddleware')

/**
 * Sends the system errors forwarded by the API routes as JSON (key and params), so that the client can translate them.
 * The other errors are left to the default error handler.
 * @param {Error} error - The error forwarded by a route.
 * @param {Request} _req - The request.
 * @param {Response} res - The response.
 * @param {NextFunction} next - The next function.
 * @returns {void}
 */
export const systemErrorMiddleware = (error: Error, _req: Request, res: Response, next: NextFunction): void => {
  const isSystemError = error instanceof SystemError || error instanceof CoreSystemError
  if (!isSystemError || res.headersSent) {
    next(error)
    return
  }
  logger.error(`system error: ${error.message}`)
  ResponseUtils.sendErr(res, error)
}
