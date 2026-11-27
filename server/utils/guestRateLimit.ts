import type { RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'

import * as ProcessUtils from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'

import * as Response from './response'

const passThrough: RequestHandler = (_req, _res, next) => next()

/**
 * Creates a middleware limiting the requests of a client IP to a group of guest endpoints (no login required):
 * 429 `appErrors:tooManyRequests` over the limit. Each call counts on its own, so call it once per group.
 * The client IP is correct behind a proxy only with `trust proxy` (set by arena-server when USE_HTTPS is true).
 */
export const createGuestRateLimit = (): RequestHandler => {
  const { guestRateLimitEnabled, guestRateLimitWindowMs, guestRateLimitRequestsPerWindow } = ProcessUtils.ENV
  if (!guestRateLimitEnabled) return passThrough

  return rateLimit({
    windowMs: guestRateLimitWindowMs,
    limit: guestRateLimitRequestsPerWindow,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      Response.sendErr(res, new SystemError('appErrors:tooManyRequests', {}, StatusCodes.TOO_MANY_REQUESTS)),
  })
}
