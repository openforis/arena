/**
 * POST /api/ai/model: the AI gateway (see service/gateway/modelGateway).
 * Body: { surveyId?, feature, dataClass, stream, call }. Response: JSON generate result or SSE stream parts.
 */
import * as Request from '@server/utils/request'

import { createDefaultModelGatewayDeps, handleModelRequest } from '../service/gateway/modelGateway'
import { requireAiFeaturePermission, requireAiFeaturesEnabled } from './aiMiddleware'

/**
 * Registers the gateway route.
 * @param {object} app - Express app.
 * @returns {void}
 */
export const init = (app): void => {
  const deps = createDefaultModelGatewayDeps()
  app.post('/ai/model', requireAiFeaturesEnabled, requireAiFeaturePermission, async (req, res) => {
    await handleModelRequest({ req, res, user: Request.getUser(req), deps })
  })
}
