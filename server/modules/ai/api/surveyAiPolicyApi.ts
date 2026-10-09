/**
 * Survey AI policy routes. They work whether or not AI features are enabled, so a policy can be set before
 * AI is switched on.
 *   GET /api/survey/:surveyId/ai-policy  (survey view)   → { policy, ceilings, effective, canEdit }
 *   PUT /api/survey/:surveyId/ai-policy  (survey admin)  body { schema, data } → same shape
 */
import * as Authorizer from '@core/auth/authorizer'

import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as Request from '@server/utils/request'

import { getSurveyAiPolicy, updateSurveyAiPolicy, type SurveyAiPolicyState } from '../service/surveyAiPolicyService'

export type SurveyAiPolicyResponse = SurveyAiPolicyState & { canEdit: boolean }

type Middleware = (req: any, res: any, next: (error?: unknown) => void) => unknown

export type SurveyAiPolicyRouteDeps = {
  requireView: Middleware
  requireEdit: Middleware
  getPolicy: (surveyId: number) => Promise<SurveyAiPolicyState>
  updatePolicy: (params: { user: any; surveyId: number; policy: unknown }) => Promise<SurveyAiPolicyState>
  fetchSurveyInfo: (surveyId: number) => Promise<any>
}

const createDefaultDeps = (): SurveyAiPolicyRouteDeps => ({
  requireView: AuthMiddleware.requireSurveyViewPermission,
  requireEdit: AuthMiddleware.requireSurveyAiPolicyEditPermission,
  getPolicy: (surveyId) => getSurveyAiPolicy(surveyId),
  updatePolicy: (params) => updateSurveyAiPolicy(params),
  fetchSurveyInfo: (surveyId) => SurveyManager.fetchSurveyById({ surveyId }),
})

const sendPolicy = async ({
  res,
  user,
  surveyId,
  state,
  deps,
}: {
  res: any
  user: any
  surveyId: number
  state: SurveyAiPolicyState
  deps: SurveyAiPolicyRouteDeps
}): Promise<void> => {
  const surveyInfo = await deps.fetchSurveyInfo(surveyId)
  const body: SurveyAiPolicyResponse = { ...state, canEdit: Authorizer.canEditSurveyAiPolicy(user, surveyInfo) }
  res.json(body)
}

/**
 * Builds the middleware chains of the two routes (tests inject the dependencies).
 * @param {SurveyAiPolicyRouteDeps} [deps] - Dependencies.
 * @returns {{get: Middleware[], put: Middleware[]}} The chains.
 */
export const createSurveyAiPolicyRoutes = (deps: SurveyAiPolicyRouteDeps = createDefaultDeps()) => {
  const getHandler: Middleware = async (req, res, next) => {
    try {
      const surveyId = Number(Request.getParams(req).surveyId)
      const user = Request.getUser(req)
      const state = await deps.getPolicy(surveyId)
      await sendPolicy({ res, user, surveyId, state, deps })
    } catch (error) {
      next(error)
    }
  }
  const putHandler: Middleware = async (req, res, next) => {
    try {
      const surveyId = Number(Request.getParams(req).surveyId)
      const user = Request.getUser(req)
      const state = await deps.updatePolicy({ user, surveyId, policy: Request.getBody(req) })
      await sendPolicy({ res, user, surveyId, state, deps })
    } catch (error) {
      next(error)
    }
  }
  return { get: [deps.requireView, getHandler], put: [deps.requireEdit, putHandler] }
}

/**
 * Registers the survey AI policy routes.
 * @param {object} app - Express router.
 * @returns {void}
 */
export const init = (app: any): void => {
  const routes = createSurveyAiPolicyRoutes()
  app.get('/survey/:surveyId/ai-policy', ...routes.get)
  app.put('/survey/:surveyId/ai-policy', ...routes.put)
}
