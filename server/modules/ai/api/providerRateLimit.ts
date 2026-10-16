import { ENV } from '@core/processUtils'
import SystemError from '@core/systemError'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import { createRateLimiter, type RateLimiter } from '../service/gateway/rateLimiter'

const TOO_MANY_REQUESTS = 429

// calls of one user that may be connecting to endpoints at the same time (each one holds a socket and a timer);
// AI_PROVIDER_MAX_IN_FLIGHT_PER_USER overrides it (0 = unlimited)
export const MAX_IN_FLIGHT_PER_USER = ENV.aiProviderMaxInFlightPerUser

type Middleware = (req: any, res: any, next: (error?: unknown) => void) => void

// the function that frees the slot of the call that a response belongs to
const releases = new WeakMap<object, () => void>()

/**
 * Frees the in-flight slot that the rate limit middleware took for the response (once; nothing when it took none).
 * The route calls it when its handler settles.
 * @param {object} res - Express response of the call.
 * @returns {void}
 */
export const releaseProviderCall = (res: object): void => {
  releases.get(res)?.()
  releases.delete(res)
}

/**
 * Creates the middleware that limits the calls of a user to the endpoints of their providers (a test, a model list,
 * and the save of a provider, which tests it again): each one opens a connection to a server of the user's choice.
 * @param {object} params - Parameters.
 * @param {RateLimiter} params.limiter - Limiter, counting per user per minute.
 * @param {number} [params.maxInFlight] - Calls of a user that may run at the same time (default 3, 0 = unlimited).
 * @returns {Middleware} The middleware (429 `aiRateLimited` over the limit or over the calls in flight).
 */
export const createProviderRateLimit = ({
  limiter,
  maxInFlight = MAX_IN_FLIGHT_PER_USER,
}: {
  limiter: RateLimiter
  maxInFlight?: number
}): Middleware => {
  const inFlight = new Map<string, number>()

  /**
   * Creates the function that counts a call of the user as finished; it counts it once, however often it is called.
   * @param {string} userUuid - User.
   * @returns {() => void} The release function.
   */
  const createRelease = (userUuid: string): (() => void) => {
    let released = false
    return () => {
      if (released) return
      released = true
      const remaining = (inFlight.get(userUuid) ?? 1) - 1
      if (remaining > 0) inFlight.set(userUuid, remaining)
      else inFlight.delete(userUuid)
    }
  }

  return (req, res, next) => {
    const userUuid = Request.getUser(req).uuid
    if ((maxInFlight > 0 && (inFlight.get(userUuid) ?? 0) >= maxInFlight) || !limiter.take(userUuid)) {
      Response.sendErr(res, new SystemError('aiRateLimited', {}, TOO_MANY_REQUESTS))
      return
    }
    inFlight.set(userUuid, (inFlight.get(userUuid) ?? 0) + 1)
    // the slot is kept until the handler settles (see releaseProviderCall): a client that goes away does not stop the
    // call to the provider, so it must not free the slot either
    releases.set(res, createRelease(userUuid))
    next()
  }
}

// the same limit as the model calls, counted on its own: the tests of a provider do not use up the chat budget
export const limitProviderCalls: Middleware = createProviderRateLimit({
  limiter: createRateLimiter({ limitPerMinute: ENV.aiRateLimitPerMinute }),
})
