/**
 * Internal/debug routes for the AI gateway. Not exposed in the docs and
 * gated to admins only — intended for smoke-testing the wiring (POST /api/ai/_internal/ping).
 */
import { generateText } from 'ai'

import { ENV } from '@core/processUtils'
import { getAiFeature } from '@common/ai/features'
import { ARENA_DEFAULT_PROVIDER_ID } from '@common/ai/providerIds'
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import { assertFeatureEnabled } from '../service/featureGate'
import { toAiSystemError } from '../service/gateway/errorMapping'
import { assertPolicyAllows } from '../service/gateway/policy'
import * as ProviderResolver from '../service/providerResolver'
import { requireAiFeaturesEnabled } from './aiMiddleware'

const FEATURE = 'internalPing'

export const init = (app) => {
  app.post(
    '/ai/_internal/ping',
    AuthMiddleware.requireLoggedInUser,
    AuthMiddleware.requireAdminPermission,
    requireAiFeaturesEnabled,
    async (req, res, next) => {
      const abortSignal = AbortSignal.timeout(ENV.aiRequestTimeoutMs)
      try {
        const user = Request.getUser(req)
        const start = Date.now()
        assertFeatureEnabled(FEATURE, user)
        // always the instance default, whatever the default of the admin is
        const providerId = ARENA_DEFAULT_PROVIDER_ID
        const effective = ProviderResolver.describeProvider({ user, providerId })
        const { model, meta } = await ProviderResolver.resolveModelForUser({ user, feature: FEATURE, providerId })
        // admin ping: no survey, ceilings only
        await assertPolicyAllows({
          surveyId: null,
          dataClass: getAiFeature(FEATURE).dataClass,
          hostingClass: meta.hostingClass ?? null,
        })
        const { text, usage } = await generateText({ model, prompt: 'Reply with the single word "ok".', abortSignal })
        res.json({ ok: true, latencyMs: Date.now() - start, effective, text, usage })
      } catch (error) {
        next(toAiSystemError(error, { timedOut: abortSignal.aborted }))
      }
    }
  )
}
