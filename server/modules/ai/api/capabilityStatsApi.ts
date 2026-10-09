/**
 * POST /api/ai/capability-stats: anonymous capability statistics (opt-in), one log line per browser session.
 */
import { StatusCodes } from '@core/systemError'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as Request from '@server/utils/request'

import * as AiTelemetry from '../service/aiTelemetry'
import { handleCapabilityStats } from '../service/capabilityStatsService'
import { requireAiFeaturesEnabled } from './aiMiddleware'

/**
 * Registers the route (204 whether recorded or ignored, so the response does not reveal the opt-in).
 * @param {object} app - Express app (API router).
 * @returns {void}
 */
export const init = (app: any): void => {
  app.post(
    '/ai/capability-stats',
    AuthMiddleware.requireLoggedInUser,
    requireAiFeaturesEnabled,
    (req: any, res: any, next: any) => {
      try {
        const user = Request.getUser(req)
        handleCapabilityStats({ user, body: Request.getBody(req), record: AiTelemetry.recordCapabilityStats })
        res.status(StatusCodes.NO_CONTENT).end()
      } catch (error) {
        next(error)
      }
    }
  )
}
