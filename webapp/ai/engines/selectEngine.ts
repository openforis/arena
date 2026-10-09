/**
 * Picks the engine for a request from the policy, the data class, the capabilities and the user's preference.
 * Pure (no AI SDK import): the UI uses it for the availability and the badge, resolveModel for the request.
 */
import type { AiDataClass } from '@common/ai/features'
import { type AiHostingClass, type AiPolicy, isHostingAllowed } from '@common/ai/policy'

import { getGatewayEngineInfo, getLocalServerEngineInfo } from './engineInfo'
import type { AiCapabilities, AiEngineSelection, AiSelectedEngine, AiUnavailableReason } from './types'

type Candidate = { engine: AiSelectedEngine | null; reason: AiUnavailableReason | null }

/** Reasons that only a change of the survey AI policy can fix. */
export const POLICY_REASONS: AiUnavailableReason[] = [
  'policyForbidsCloud',
  'policyForbidsOrgHosted',
  'policyForbidsAll',
]

/**
 * Returns true when the reason comes from the survey AI policy (only a policy change fixes it).
 * @param {AiUnavailableReason} reason - Reason.
 * @returns {boolean} True for policy reasons.
 */
export const isPolicyReason = (reason: AiUnavailableReason): boolean => POLICY_REASONS.includes(reason)

/**
 * Returns the unavailable reason for a hosting class the policy forbids.
 * @param {AiHostingClass} hostingClass - Hosting class of the engine.
 * @returns {AiUnavailableReason} The policy reason.
 */
const policyReason = (hostingClass: AiHostingClass): AiUnavailableReason => {
  if (hostingClass === 'cloud') return 'policyForbidsCloud'
  if (hostingClass === 'orgHosted') return 'policyForbidsOrgHosted'
  return 'policyForbidsAll'
}

/**
 * Builds the local server candidate, or the capability reason why it cannot be used.
 * @param {AiCapabilities} capabilities - Capabilities.
 * @returns {Candidate} The candidate.
 */
const localCandidate = (capabilities: AiCapabilities): Candidate => {
  const { localServer } = capabilities
  if (!localServer.enabled) return { engine: null, reason: 'localServerNotEnabled' }
  if (localServer.reachable !== true) return { engine: null, reason: 'localServerUnreachable' }
  const { modelId } = localServer
  if (!modelId || !localServer.models.includes(modelId)) return { engine: null, reason: 'localServerNoModel' }
  const engine = getLocalServerEngineInfo(localServer)
  return engine ? { engine, reason: null } : { engine: null, reason: 'localServerUnreachable' }
}

/**
 * Builds the gateway candidate, or the reason why it cannot be used.
 * @param {AiCapabilities} capabilities - Capabilities.
 * @returns {Candidate} The candidate.
 */
const gatewayCandidate = (capabilities: AiCapabilities): Candidate => {
  const engine = capabilities.gateway.available ? getGatewayEngineInfo(capabilities.gateway) : null
  return engine ? { engine, reason: null } : { engine: null, reason: 'gatewayNotConfigured' }
}

/**
 * Turns a candidate into a policy reason when the policy forbids its hosting class.
 * @param {Candidate} candidate - Candidate.
 * @param {object} params - Parameters.
 * @param {AiPolicy} params.effective - Effective policy.
 * @param {AiDataClass} params.dataClass - Data class of the request.
 * @returns {Candidate} The candidate, or a policy-forbidden one.
 */
const applyPolicy = (
  candidate: Candidate,
  { effective, dataClass }: { effective: AiPolicy; dataClass: AiDataClass }
): Candidate => {
  const { engine } = candidate
  if (!engine) return candidate
  return isHostingAllowed({ effective, dataClass, hostingClass: engine.hostingClass })
    ? candidate
    : { engine: null, reason: policyReason(engine.hostingClass) }
}

/**
 * Selects the engine for a request.
 * @param {object} params - Parameters.
 * @param {AiPolicy|null} params.effective - Effective policy, null fails closed (survey policy within the instance ceilings).
 * @param {AiDataClass} params.dataClass - Data class of the request.
 * @param {AiCapabilities} params.capabilities - What this browser can use.
 * @param {object} params.prefs - User preferences.
 * @param {boolean} params.prefs.preferLocal - Local server first.
 * @returns {AiEngineSelection} The engine, or the reasons why none qualifies.
 */
export const selectEngine = ({
  effective,
  dataClass,
  capabilities,
  prefs,
}: {
  effective: AiPolicy | null
  dataClass: AiDataClass
  capabilities: AiCapabilities
  prefs: { preferLocal: boolean }
}): AiEngineSelection => {
  if (!effective || effective[dataClass] === 'off') return { unavailable: ['policyForbidsAll'] }

  const local = applyPolicy(localCandidate(capabilities), { effective, dataClass })
  const gateway = applyPolicy(gatewayCandidate(capabilities), { effective, dataClass })
  const ordered = prefs.preferLocal ? [local, gateway] : [gateway, local]

  const chosen = ordered.find((candidate) => candidate.engine)
  if (chosen?.engine) return { engine: chosen.engine }

  const reasons: AiUnavailableReason[] = []
  for (const { reason } of ordered) {
    if (reason && !reasons.includes(reason)) reasons.push(reason)
  }
  return { unavailable: reasons }
}
