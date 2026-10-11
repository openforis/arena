import { ServiceRegistry, ServiceType } from '@openforis/arena-core'
import { uuidv4 } from '@core/uuid'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

/**
 * Builds a user that belongs to no group (cannot edit any survey).
 * @param {object} user - User to copy.
 * @returns {object} The user without groups.
 */
export const buildUserWithoutGroups = (user: any) => ({
  ...user,
  uuid: uuidv4(),
  name: 'Outsider',
  email: 'outsider@example.com',
  authGroups: [],
})

/**
 * Runs the permission middleware (first handler) of a route.
 * @param {object} params - Parameters.
 * @param {object} params.route - Route with its handlers.
 * @param {object} params.user - Requesting user.
 * @param {number} params.surveyId - Survey id.
 * @returns {Promise<any>} The error passed to next, or undefined when access is granted.
 */
export const runRoutePermission = async ({
  route,
  user,
  surveyId,
}: {
  route: { handlers: any[] } | undefined
  user: any
  surveyId: number
}): Promise<any> => {
  // the permission middleware reads the survey through this service (registered by the server at startup)
  ServiceRegistry.getInstance().registerService(ServiceType.survey, {
    get: ({ surveyId: id }: { surveyId: number | string }) =>
      SurveyManager.fetchSurveyById({ surveyId: Number(id), draft: true }),
  } as any)
  let error: any
  const req = { params: { surveyId: String(surveyId) }, query: {}, body: {}, user }
  await route?.handlers[0](req, {}, (nextError?: any) => {
    error = nextError
  })
  return error
}
