/**
 * Express routes for the per-user AI settings page. All routes are
 * "self-only": a user can only read or modify their own AI configuration.
 *
 *   GET    /api/ai/settings        — current settings + effective source
 *   PUT    /api/ai/settings        — save / update
 *   POST   /api/ai/settings/test   — verify the saved key with a 5-token call
 *   POST   /api/ai/settings/models — list models from the provider for the dropdown
 *   DELETE /api/ai/settings        — clear personal override
 */
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as AiSettingsService from '../service/aiSettingsService'
import * as ProviderResolver from '../service/providerResolver'
import * as SecretBox from '@server/utils/crypto/secretBox'
import { requireAiFeaturesEnabled } from './aiMiddleware'

const buildResponseBody = async (user) => {
  const settings = AiSettingsService.getPublicSettings(user)
  const effective = await ProviderResolver.describeEffectiveSource(user)
  return {
    ...settings,
    effectiveSource: effective.source,
    effectiveProvider: effective.provider,
    effectiveModel: effective.model,
    encryptionConfigured: SecretBox.isConfigured(),
  }
}

export const init = (app) => {
  app.get('/ai/settings', AuthMiddleware.requireLoggedInUser, requireAiFeaturesEnabled, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      res.json(await buildResponseBody(user))
    } catch (error) {
      next(error)
    }
  })

  app.put('/ai/settings', AuthMiddleware.requireLoggedInUser, requireAiFeaturesEnabled, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const update = Request.getBody(req)
      const userUpdated = await AiSettingsService.saveSettings({ user, update })
      res.json(await buildResponseBody(userUpdated))
    } catch (error) {
      next(error)
    }
  })

  app.post(
    '/ai/settings/test',
    AuthMiddleware.requireLoggedInUser,
    requireAiFeaturesEnabled,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const result = await AiSettingsService.testConnection({ user })
        res.json(result)
      } catch (error) {
        next(error)
      }
    }
  )

  app.post(
    '/ai/settings/models',
    AuthMiddleware.requireLoggedInUser,
    requireAiFeaturesEnabled,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const { provider, baseUrl, apiKey } = Request.getBody(req) || {}
        const result = await AiSettingsService.listModels({ user, provider, baseUrl, apiKey })
        res.json(result)
      } catch (error) {
        next(error)
      }
    }
  )

  app.delete('/ai/settings', AuthMiddleware.requireLoggedInUser, requireAiFeaturesEnabled, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const userUpdated = await AiSettingsService.clearSettings({ user })
      res.json(await buildResponseBody(userUpdated))
    } catch (error) {
      next(error)
    }
  })
}
