import type { LanguageModel } from 'ai'

import { getAiFeature } from '@common/ai/features'
import { assertHostingAllowed } from '@common/ai/policy'
import SystemError, { StatusCodes } from '@core/systemError'

import type { PolicyContext } from '../policy/policyContextLoader'

export type ResolveGatewayModelDeps = {
  loadPolicyContext: (params: { surveyId?: number | null }) => Promise<PolicyContext>
  loadGatewayModel: (params: { feature: string; surveyId?: number }) => Promise<LanguageModel>
}

// lazy: both pull in the app store and the WebSocket client, which the workflow unit tests must not load
const defaultDeps: ResolveGatewayModelDeps = {
  loadPolicyContext: async (params) => (await import('../policy/policyContext')).loadPolicyContext(params),
  loadGatewayModel: async (params) => (await import('./getModel')).getGatewayModel(params),
}

/**
 * Throws when the survey AI policy (or, without a survey, the instance ceilings) doesn't allow the gateway
 * provider for the feature's data class. The server checks again: this avoids a pointless round trip.
 * @param {object} params - Parameters.
 * @param {string} params.feature - Feature key.
 * @param {number} [params.surveyId] - Survey id.
 * @param {Function} loadPolicyContext - Loader of the effective policy and hosting class.
 * @returns {Promise<void>} Resolves when allowed; rejects with `aiPolicyRefused` or `aiNotConfigured`.
 */
export const assertBrowserPolicyAllows = async (
  { feature, surveyId }: { feature: string; surveyId?: number | null },
  loadPolicyContext: ResolveGatewayModelDeps['loadPolicyContext']
): Promise<void> => {
  const { effective, hostingClass } = await loadPolicyContext({ surveyId })
  // no provider configured: the gateway would answer aiNotConfigured, say it now (deviation 7)
  if (!hostingClass) throw new SystemError('aiNotConfigured', {}, StatusCodes.SERVICE_UNAVAILABLE)
  // unknown feature: the stricter class
  const dataClass = getAiFeature(feature)?.dataClass ?? 'data'
  assertHostingAllowed({ effective, dataClass, hostingClass })
}

/**
 * Returns the given model (tests) or, after the policy check, the gateway model of the feature.
 * @param {object} params - Parameters.
 * @param {LanguageModel} [params.model] - Model to use as is (no policy check).
 * @param {string} params.feature - Feature key.
 * @param {number} [params.surveyId] - Survey (required for survey-scoped features).
 * @param {ResolveGatewayModelDeps} [deps] - Dependencies (tests).
 * @returns {Promise<LanguageModel>} The model.
 */
export const resolveGatewayModel = async (
  { model, feature, surveyId }: { model?: LanguageModel; feature: string; surveyId?: number },
  deps: ResolveGatewayModelDeps = defaultDeps
): Promise<LanguageModel> => {
  if (model) return model
  await assertBrowserPolicyAllows({ feature, surveyId }, deps.loadPolicyContext)
  return deps.loadGatewayModel({ feature, surveyId })
}
