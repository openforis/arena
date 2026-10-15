import { ENV } from '@core/processUtils'
import SystemError from '@core/systemError'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import { createRateLimiter, type RateLimiter } from '../service/gateway/rateLimiter'

const TOO_MANY_REQUESTS = 429

type Middleware = (req: any, res: any, next: (error?: unknown) => void) => void

/**
 * Creates the middleware that limits the calls of a user to the endpoints of their providers (a test, a model list,
 * and the save of a provider, which tests it again): each one opens a connection to a server of the user's choice.
 * @param {object} params - Parameters.
 * @param {RateLimiter} params.limiter - Limiter, counting per user.
 * @returns {Middleware} The middleware (429 `aiRateLimited` over the limit).
 */
export const createProviderRateLimit =
  ({ limiter }: { limiter: RateLimiter }): Middleware =>
  (req, res, next) => {
    const user = Request.getUser(req)
    if (!limiter.take(user.uuid)) {
      Response.sendErr(res, new SystemError('aiRateLimited', {}, TOO_MANY_REQUESTS))
      return
    }
    next()
  }

// the same limit as the model calls, counted on its own: the tests of a provider do not use up the chat budget
export const limitProviderCalls: Middleware = createProviderRateLimit({
  limiter: createRateLimiter({ limitPerMinute: ENV.aiRateLimitPerMinute }),
})
