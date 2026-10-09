/**
 * App wiring of the model resolver: current user, survey AI policy (B's cache), capabilities, consent dialog,
 * gateway model (A) and the lazily loaded local server engine.
 */
import type { AiPolicy } from '@common/ai/policy'

import { isConfigAiFeaturesEnabled } from '@webapp/store/system/info/state'
import { store as reduxStore } from '@webapp/store/store'
import { isSurveyScopedFeature } from '@webapp/ai/policy/aiFeatureAvailability'
import { fetchSurveyAiPolicy } from '@webapp/ai/policy/surveyAiPolicyClient'
import { getGatewayModel } from '@webapp/ai/runtime/getModel'

import {
  getAiCapabilitiesStore,
  getCurrentUserUuid,
  loadAiCapabilities,
  notifyAiCapabilities,
} from './capabilitiesStore'
import { requestLocalServerConsent } from './consentRequests'
import { getBrowserStorage } from './localServerSettings'
import type { ModelResolverDeps } from './resolveModel'

// nothing known (no survey for a survey feature, settings not loaded): nothing is allowed
const OFF_POLICY: AiPolicy = { schema: 'off', data: 'off' }

export const appModelResolverDeps: ModelResolverDeps = {
  getUserUuid: getCurrentUserUuid,
  isInstanceEnabled: () => isConfigAiFeaturesEnabled(reduxStore.getState()),
  getSettings: () => getAiCapabilitiesStore().getSettings(),
  loadCapabilities: loadAiCapabilities,
  // like B: survey features use the survey's effective policy, the others (Help) the instance ceilings
  getEffectivePolicy: async (surveyId, capabilities, feature) => {
    if (!isSurveyScopedFeature(feature)) return capabilities.instance.policyCeilings ?? OFF_POLICY
    return surveyId ? (await fetchSurveyAiPolicy(surveyId)).effective : OFF_POLICY
  },
  getLocalSettings: () => getAiCapabilitiesStore().getLocalSettings(),
  storage: getBrowserStorage(),
  requestConsent: requestLocalServerConsent,
  onConsentChange: notifyAiCapabilities,
  createGatewayModel: (options) => getGatewayModel(options),
  createLocalEngine: async (localServer) => {
    const { createLocalServerEngine } = await import('./localServerEngine')
    return createLocalServerEngine({ localServer, fetchImpl: (url, init) => fetch(url, init) })
  },
}
