/**
 * App wiring of the model resolver: current user, effective policy, capabilities, consent dialog,
 * gateway model and the lazily loaded local server engine.
 */
import { getEffectivePolicyFor } from '@webapp/ai/policy/policyContext'
import { getGatewayModel } from '@webapp/ai/runtime/getModel'
import { getBrowserLocalStorage } from '@webapp/ai/storage/resilientStorage'
import { store as reduxStore } from '@webapp/store/store'
import { isConfigAiFeaturesEnabled } from '@webapp/store/system/info/state'

import {
  getAiCapabilitiesStore,
  getCurrentUserUuid,
  loadAiCapabilities,
  notifyAiCapabilities,
  refreshAiCapabilities,
} from './capabilitiesStore'
import { requestLocalServerConsent } from './consentRequests'
import type { ModelResolverDeps } from './resolveModel'

export const appModelResolverDeps: ModelResolverDeps = {
  getUserUuid: getCurrentUserUuid,
  isInstanceEnabled: () => isConfigAiFeaturesEnabled(reduxStore.getState()),
  getSettings: () => getAiCapabilitiesStore().getSettings(),
  loadCapabilities: loadAiCapabilities,
  refreshCapabilities: refreshAiCapabilities,
  getEffectivePolicyFor,
  storage: getBrowserLocalStorage(),
  requestConsent: requestLocalServerConsent,
  onConsentChange: notifyAiCapabilities,
  createGatewayModel: (options) => getGatewayModel(options),
  createLocalEngine: async (localServer) => {
    const { createLocalServerEngine } = await import('./localServerEngine')
    return createLocalServerEngine({ localServer, fetchImpl: (url, init) => fetch(url, init) })
  },
}
