/**
 * Internal/debug routes for the AI gateway. Not exposed in the docs and
 * gated to admins only — intended for smoke-testing the wiring during
 * Phase 0 verification ("Phase 0 done when ... POST /api/ai/_internal/ping
 * succeeds").
 */
import { z } from 'zod'

import { ENV } from '@core/processUtils'

import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as ModelClient from '../service/modelClient'
import * as ProviderResolver from '../service/providerResolver'

const PingSchema = z.object({
  reply: z.string().describe('Reply with the literal word "ok".'),
})

export const init = (app) => {
  app.post(
    '/ai/_internal/ping',
    AuthMiddleware.requireLoggedInUser,
    AuthMiddleware.requireAdminPermission,
    async (req, res, next) => {
      try {
        if (!ENV.aiFeaturesEnabled) {
          res.status(404).json({ error: 'aiFeaturesDisabled' })
          return
        }
        const user = Request.getUser(req)
        const start = Date.now()
        const effective = await ProviderResolver.describeEffectiveSource(user)
        const result = await ModelClient.generateStructured({
          user,
          feature: 'internalPing',
          prompt: 'Reply with a JSON object whose only field "reply" contains the single word "ok".',
          schema: PingSchema,
        })
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
