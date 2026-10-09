import type { LanguageModel } from 'ai'

/**
 * Returns the given model (tests) or the gateway model of the feature. getModel is loaded lazily: it imports the
 * app store and the WebSocket client, which the workflow modules (unit tested under Node) must not load.
 * @param {object} params - Parameters.
 * @param {LanguageModel} [params.model] - Model to use as is.
 * @param {string} params.feature - Feature key.
 * @param {number} [params.surveyId] - Survey (required for survey-scoped features).
 * @returns {Promise<LanguageModel>} The model.
 */
export const resolveGatewayModel = async ({
  model,
  feature,
  surveyId,
}: {
  model?: LanguageModel
  feature: string
  surveyId?: number
}): Promise<LanguageModel> => model ?? (await import('./getModel')).getGatewayModel({ feature, surveyId })
