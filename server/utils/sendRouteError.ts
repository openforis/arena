import { SystemError as CoreSystemError } from '@openforis/arena-core'

import SystemError, { StatusCodes } from '@core/systemError'

import * as Log from '@server/log/log'

import * as Response from './response'
import UnauthorizedError from './unauthorizedError'

const Logger = Log.getLogger('Routes')

const defaultUnexpectedKey = 'appErrors:unexpectedServerError'

/**
 * Sends the error of a route as JSON with its key. An application error keeps its key, params and status; any other
 * error (a database error, a bug) is logged and the client gets only a generic key, never the text of the error.
 * @param {object} params - The parameters.
 * @param {object} params.res - The response.
 * @param {unknown} params.error - The error.
 * @param {string} [params.unexpectedKey] - The key sent for an unexpected error.
 * @param {string} [params.context] - What the route was doing (for the log).
 * @param {(message: string) => void} [params.logError] - The logger (tests).
 * @returns {void}
 */
export const sendRouteError = ({
  res,
  error,
  unexpectedKey = defaultUnexpectedKey,
  context = 'route',
  logError = (message: string) => Logger.error(message),
}: {
  res: any
  error: any
  unexpectedKey?: string
  context?: string
  logError?: (message: string) => void
}): void => {
  if (error instanceof UnauthorizedError || error instanceof SystemError || error instanceof CoreSystemError) {
    Response.sendErr(res, error)
    return
  }
  logError(`${context} failed: ${error?.stack ?? error}`)
  Response.sendErr(res, new SystemError(unexpectedKey, {}, error?.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR))
}
