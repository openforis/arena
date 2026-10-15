/**
 * App wiring of the model resolver: current user, effective policy, capabilities, consent dialog,
 * gateway model and the lazily loaded local server engine.
 */
import { isConfigAiFeaturesEnabled } from '@webapp/store/system/info/state'
import { store as reduxStore } from '@webapp/store/store'
import { getEffectivePolicyFor } from '@webapp/ai/policy/policyContext'
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

export const appModelResolverDeps: ModelResolverDeps = {
  getUserUuid: getCurrentUserUuid,
  isInstanceEnabled: () => isConfigAiFeaturesEnabled(reduxStore.getState()),
  getSettings: () => getAiCapabilitiesStore().getSettings(),
  loadCapabilities: loadAiCapabilities,
  getEffectivePolicyFor,
  storage: getBrowserStorage(),
  requestConsent: requestLocalServerConsent,
  onConsentChange: notifyAiCapabilities,
  createGatewayModel: (options) => getGatewayModel(options),
  createLocalEngine: async (localServer) => {
    const { createLocalServerEngine } = await import('./localServerEngine')
    return createLocalServerEngine({ localServer, fetchImpl: (url, init) => fetch(url, init) })
  },
}
