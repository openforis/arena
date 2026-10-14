/**
 * Express routes for the per-user AI settings. All routes are "self-only": a user can only read or modify their own
 * AI configuration, and every `acct:` id is checked against the user's own providers.
 *
 *   GET    /api/ai/settings          — settings, providers (no keys), admin default, engine fields
 *   PUT    /api/ai/settings          — save the access level and toggles (the old body also saves `acct:legacy`)
 *   PUT    /api/ai/settings/default  — { providerId, origin? } choose the default provider
 *   POST   /api/ai/providers/test    — test a draft or a saved provider (`id` + changed fields)
 *   POST   /api/ai/providers/models  — list the models of a draft or a saved provider
 *   POST   /api/ai/providers         — add an account provider (tested again here)
 *   PUT    /api/ai/providers/:id     — edit an account provider (`apiKey` omitted = keep)
 *   DELETE /api/ai/providers/:id     — remove an account provider
 *   POST   /api/ai/settings/test, POST /api/ai/settings/models, DELETE /api/ai/settings — the old panel (removed in 3b)
 */
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as SecretBox from '@server/utils/crypto/secretBox'
import { ENV } from '@core/processUtils'

import * as AiProviderService from '../service/aiProviderService'
import * as AiSettingsService from '../service/aiSettingsService'
import * as ProviderResolver from '../service/providerResolver'
import { getDisabledFeatureKeys } from '../service/featureGate'
import { getEngineSettingsFields } from '../service/engineSettings'
import { requireAiFeaturesEnabled } from './aiMiddleware'

/**
 * Returns the body of GET /api/ai/settings.
 * @param {object} user - Arena user.
 * @returns {Promise<object>} The settings body.
 */
const buildResponseBody = async (user) => {
  const settings = AiSettingsService.getPublicSettings(user)
  const effective = await ProviderResolver.describeEffectiveSource(user)
  return {
    ...settings,
    effectiveSource: effective.source,
    effectiveProvider: effective.provider,
    effectiveModel: effective.model,
    // where the gateway sends the data of a call without providerId
    hostingClass: effective.hostingClass,
    // the instance default (no key), for the "Arena default" row
    adminDefault: ProviderResolver.describeAdminDefault(),
    encryptionConfigured: SecretBox.isConfigured(),
    // the dialog offers the mock type only where the server accepts it (e2e servers)
    mockProviderEnabled: ENV.aiMockProviderEnabled === true,
    disabledFeatures: getDisabledFeatureKeys(),
    // orgHostedBaseUrls, policyCeilings (instance ceilings) and maxPromptChars, for the browser engines
    ...getEngineSettingsFields(),
  }
}

const guards = [AuthMiddleware.requireLoggedInUser, requireAiFeaturesEnabled]

/**
 * Wraps a handler: passes the logged-in user, the body and the route params, sends its result as JSON and forwards
 * errors to Express.
 * @param {(args: object) => Promise<object>} handler - Receives `{ user, body, params }`.
 * @returns {(req: object, res: object, next: (error?: unknown) => void) => Promise<void>} The Express handler.
 */
const jsonRoute = (handler) => async (req, res, next) => {
  try {
    res.json(await handler({ user: Request.getUser(req), body: Request.getBody(req) || {}, params: req.params }))
  } catch (error) {
    next(error)
  }
}

/**
 * Registers the AI settings and provider routes.
 * @param {object} app - Express router.
 * @returns {void}
 */
export const init = (app) => {
  app.get(
    '/ai/settings',
    ...guards,
    jsonRoute(({ user }) => buildResponseBody(user))
  )

  app.put(
    '/ai/settings',
    ...guards,
    jsonRoute(async ({ user, body }) => buildResponseBody(await AiSettingsService.saveSettings({ user, update: body })))
  )

  app.put(
    '/ai/settings/default',
    ...guards,
    jsonRoute(async ({ user, body }) => {
      const { user: updated, applied } = await AiProviderService.setDefaultProvider({
        user,
        providerId: body.providerId,
        origin: body.origin,
      })
      return { applied, settings: await buildResponseBody(updated) }
    })
  )

  app.post(
    '/ai/providers/test',
    ...guards,
    jsonRoute(({ user, body }) => AiProviderService.testProvider({ user, input: body }))
  )

  app.post(
    '/ai/providers/models',
    ...guards,
    jsonRoute(({ user, body }) => AiProviderService.listProviderModels({ user, input: body }))
  )

  app.post(
    '/ai/providers',
    ...guards,
    jsonRoute(async ({ user, body }) => {
      const { user: updated, provider } = await AiProviderService.addProvider({ user, input: body })
      return { provider, settings: await buildResponseBody(updated) }
    })
  )

  app.put(
    '/ai/providers/:id',
    ...guards,
    jsonRoute(async ({ user, body, params }) => {
      const { user: updated, provider } = await AiProviderService.updateProvider({ user, id: params.id, input: body })
      return { provider, settings: await buildResponseBody(updated) }
    })
  )

  app.delete(
    '/ai/providers/:id',
    ...guards,
    jsonRoute(async ({ user, params }) => {
      const { user: updated } = await AiProviderService.removeProvider({ user, id: params.id })
      return { settings: await buildResponseBody(updated) }
    })
  )

  // the old single-provider panel (removed in plan 3b)
  app.post(
    '/ai/settings/test',
    ...guards,
    jsonRoute(({ user, body }) => {
      const { provider, model, baseUrl, apiKey } = body
      return AiSettingsService.testConnection({ user, provider, model, baseUrl, apiKey })
    })
  )

  app.post(
    '/ai/settings/models',
    ...guards,
    jsonRoute(({ user, body }) => {
      const { provider, baseUrl, apiKey } = body
      return AiSettingsService.listModels({ user, provider, baseUrl, apiKey })
    })
  )

  app.delete(
    '/ai/settings',
    ...guards,
    jsonRoute(async ({ user }) => buildResponseBody(await AiSettingsService.clearSettings({ user })))
  )
}
