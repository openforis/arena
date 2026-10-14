/**
 * Picks the engine of a request from one provider (the request's, else the user's default), the policy and the data
 * class. No fallback: when that provider cannot be used, the request fails with the reason.
 * Pure (no AI SDK import): the UI uses it for the availability and the badge, resolveModel for the request.
 */
import type { AiDataClass } from '@common/ai/features'
import { type AiPolicy, isHostingAllowed } from '@common/ai/policy'
import { isLocalProviderId } from '@common/ai/providerIds'

import { getGatewayEngineInfo, getLocalServerEngineInfo } from './engineInfo'
import { getLocalProviderStatus } from './providerEntries'
import type { AiCapabilities, AiEngineSelection, AiProviderEntry, AiUnavailableReason } from './types'

/** Reasons that only a change of the survey AI policy can fix. */
export const POLICY_REASONS: AiUnavailableReason[] = ['policyForbids']

/**
 * Returns true when the reason comes from the survey AI policy (only a policy change fixes it).
 * @param {AiUnavailableReason} reason - Reason.
 * @returns {boolean} True for policy reasons.
 */
export const isPolicyReason = (reason: AiUnavailableReason): boolean => POLICY_REASONS.includes(reason)

/**
 * Returns the provider a request uses: the requested one while it is in the list, else the user's default.
 * @param {object} params - Parameters.
 * @param {AiCapabilities} params.capabilities - Capabilities (provider list and default).
 * @param {string|null} [params.providerId] - Requested provider (the conversation's).
 * @returns {string} The provider id (the default may itself be missing from the list).
 */
export const getEffectiveProviderId = ({
  capabilities,
  providerId,
}: {
  capabilities: AiCapabilities
  providerId?: string | null
}): string =>
  providerId && capabilities.providers.some((entry) => entry.id === providerId)
    ? providerId
    : capabilities.defaultProviderId

/**
 * Returns a selection with one reason.
 * @param {AiUnavailableReason} reason - Reason.
 * @returns {AiEngineSelection} The selection.
 */
const unavailable = (reason: AiUnavailableReason): AiEngineSelection => ({ unavailable: [reason] })

/**
 * Returns the engine of a local provider from its probe.
 * @param {AiProviderEntry} entry - Local provider.
 * @param {AiCapabilities} capabilities - Capabilities (probes by id).
 * @returns {AiEngineSelection} The engine, or notAvailable.
 */
const selectLocal = (entry: AiProviderEntry, capabilities: AiCapabilities): AiEngineSelection => {
  const capability = capabilities.local[entry.id] ?? null
  if (!capability || getLocalProviderStatus(capability) !== 'ready') return unavailable('notAvailable')
  const info = getLocalServerEngineInfo(capability, entry.name)
  return info ? { engine: { ...info, providerId: entry.id } } : unavailable('notAvailable')
}

/**
 * Returns the gateway engine of an account provider or of Arena default.
 * @param {AiProviderEntry} entry - Provider.
 * @param {AiCapabilities} capabilities - Capabilities (instance prompt cap).
 * @returns {AiEngineSelection} The engine, or notAvailable.
 */
const selectGateway = (entry: AiProviderEntry, capabilities: AiCapabilities): AiEngineSelection => {
  // a provider whose last test failed (or whose key is unreadable) fails every call; not tested yet is still tried
  if (entry.status === 'notAvailable' || !entry.hostingClass) return unavailable('notAvailable')
  const info = getGatewayEngineInfo({
    hostingClass: entry.hostingClass,
    // Arena default is shown by its admin provider type ("OpenAI"), an account provider by the user's name for it
    provider: entry.kind === 'arenaDefault' ? entry.type : entry.name,
    model: entry.model,
    maxPromptChars: capabilities.instance.maxPromptChars,
  })
  return info ? { engine: { ...info, providerId: entry.id } } : unavailable('notAvailable')
}

/**
 * Selects the engine of a request.
 * @param {object} params - Parameters.
 * @param {AiPolicy|null} params.effective - Effective policy, null fails closed (survey policy within the instance ceilings).
 * @param {AiDataClass} params.dataClass - Data class of the request.
 * @param {AiCapabilities} params.capabilities - Providers of this user and browser.
 * @param {string|null} [params.providerId] - The conversation's provider (default: the user's default).
 * @returns {AiEngineSelection} The engine, or the one reason why the provider cannot be used.
 */
export const selectEngine = ({
  effective,
  dataClass,
  capabilities,
  providerId,
}: {
  effective: AiPolicy | null
  dataClass: AiDataClass
  capabilities: AiCapabilities
  providerId?: string | null
}): AiEngineSelection => {
  if (!effective || effective[dataClass] === 'off') return unavailable('policyForbids')
  const id = getEffectiveProviderId({ capabilities, providerId })
  const entry = capabilities.providers.find((candidate) => candidate.id === id)
  // a local default saved on another computer: never replaced by another provider
  if (!entry) return unavailable(isLocalProviderId(id) ? 'missingOnThisBrowser' : 'notAvailable')
  // the policy first: a blocked provider says so even while it is down
  if (entry.hostingClass && !isHostingAllowed({ effective, dataClass, hostingClass: entry.hostingClass })) {
    return unavailable('policyForbids')
  }
  if (entry.status === 'notSetUp') return unavailable('notSetUp')
  return entry.kind === 'local' ? selectLocal(entry, capabilities) : selectGateway(entry, capabilities)
}
