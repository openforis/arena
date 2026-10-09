import { ENV } from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'
import { AiFeaturePermission, getAiFeature, isGatewayFeature } from '@common/ai/features'

import * as Response from '@server/utils/response'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

type Middleware = (req: any, res: any, next: (error?: unknown) => void) => unknown

/**
 * Rejects requests when AI is switched off on the deployment (404, as if the routes didn't exist).
 * @param {object} req - Express request.
 * @param {object} res - Express response.
 * @param {(error?: unknown) => void} next - Next middleware.
 * @returns {void}
 */
export const requireAiFeaturesEnabled: Middleware = (req, res, next) => {
  if (!ENV.aiFeaturesEnabled) {
    Response.sendErr(res, new SystemError('aiFeaturesDisabled', {}, StatusCodes.NOT_FOUND))
    return
  }
  next()
}

/** Permission middleware per feature permission (exported so tests can lock the mapping). */
export const permissionMiddlewares: Record<string, Middleware> = {
  [AiFeaturePermission.loggedIn]: AuthMiddleware.requireLoggedInUser,
  [AiFeaturePermission.surveyView]: AuthMiddleware.requireSurveyViewPermission,
  [AiFeaturePermission.surveyEdit]: AuthMiddleware.requireSurveyEditPermission,
  [AiFeaturePermission.recordListView]: AuthMiddleware.requireRecordListViewPermission,
  [AiFeaturePermission.recordCleanse]: AuthMiddleware.requireRecordCleansePermission,
}

/**
 * Checks the permission the requested gateway feature needs (survey taken from `body.surveyId`).
 * @param {object} req - Express request.
 * @param {object} res - Express response.
 * @param {(error?: unknown) => void} next - Next middleware.
 * @returns {unknown} The permission middleware result.
 */
export const requireAiFeaturePermission: Middleware = (req, res, next) => {
  const feature = req.body?.feature
  const middleware = isGatewayFeature(feature) ? permissionMiddlewares[getAiFeature(feature).permission] : null
  if (!middleware) {
    Response.sendErr(
      res,
      new SystemError('aiFeatureUnknown', { feature: String(feature).slice(0, 64) }, StatusCodes.BAD_REQUEST)
    )
    return undefined
  }
  return middleware(req, res, next)
}
