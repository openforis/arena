/**
 * App wiring of the gateway model (auth token + token refresh shared with axios).
 */
import type { LanguageModelV4 } from '@ai-sdk/provider'

import SystemError from '@core/systemError'
import { getAiFeature } from '@common/ai/features'

import { ApiConstants } from '@webapp/service/api/utils/apiConstants'
import { refreshAuthToken } from '@webapp/app/appErrorsMiddleware'

import { createAuthorizedFetch } from './authorizedFetch'
import { createGatewayModel } from './gatewayModel'

const authorizedFetch = createAuthorizedFetch({
  fetchImpl: (url, init) => fetch(url, init),
  getAuthToken: ApiConstants.getAuthToken,
  refreshAuthToken: async () => (await refreshAuthToken()).authToken ?? null,
})

/**
 * Returns the gateway model for a feature.
 * @param {object} params - Parameters.
 * @param {string} params.feature - Feature key.
 * @param {number} [params.surveyId] - Survey (required for survey-scoped features).
 * @returns {LanguageModelV4} The model.
 */
export const getGatewayModel = ({ feature, surveyId }: { feature: string; surveyId?: number }): LanguageModelV4 => {
  const aiFeature = getAiFeature(feature)
  if (!aiFeature) throw new SystemError('aiFeatureUnknown', { feature }, 400)
  return createGatewayModel({ feature, dataClass: aiFeature.dataClass, surveyId, fetchImpl: authorizedFetch })
}
