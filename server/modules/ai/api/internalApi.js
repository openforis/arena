/**
 * Internal/debug routes for the AI gateway. Not exposed in the docs and
 * gated to admins only — intended for smoke-testing the wiring (POST /api/ai/_internal/ping).
 */
import { z } from 'zod'

import { ARENA_DEFAULT_PROVIDER_ID } from '@common/ai/providerIds'
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as ModelClient from '../service/modelClient'
import * as ProviderResolver from '../service/providerResolver'
import { requireAiFeaturesEnabled } from './aiMiddleware'

const PingSchema = z.object({
  reply: z.string().describe('Reply with the literal word "ok".'),
})

/**
 * Builds the model client dependencies of the ping: it always tests the instance default, whatever the default of
 * the admin is.
 * @returns {object} The dependencies of ModelClient.
 */
export const createPingDeps = () => ({
  ...ModelClient.createDefaultModelClientDeps(),
  resolveModel: ({ user, feature }) =>
    ProviderResolver.resolveModelForUser({ user, feature, providerId: ARENA_DEFAULT_PROVIDER_ID }),
})

export const init = (app) => {
  app.post(
    '/ai/_internal/ping',
    AuthMiddleware.requireLoggedInUser,
    AuthMiddleware.requireAdminPermission,
    requireAiFeaturesEnabled,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const start = Date.now()
        const effective = ProviderResolver.describeProvider({ user, providerId: ARENA_DEFAULT_PROVIDER_ID })
        const result = await ModelClient.generateStructured(
          {
            user,
            feature: 'internalPing',
            surveyId: null, // admin ping: no survey, ceilings only
            prompt: 'Reply with a JSON object whose only field "reply" contains the single word "ok".',
            schema: PingSchema,
          },
          createPingDeps()
        )
        res.json({
          ok: true,
          latencyMs: Date.now() - start,
          effective,
          object: result.object,
          usage: result.usage,
        })
      } catch (error) {
        next(error)
      }
    }
  )
}
