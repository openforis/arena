/**
 * Availability of an AI feature from the engine selection: the engine a click would use and where the data goes,
 * or why no engine qualifies. Same selectEngine inputs as resolveModel, so the badge names the engine actually used.
 */
import type { AiDataClass } from '@common/ai/features'
import type { AiPolicy } from '@common/ai/policy'

import {
  type AiDataLocation,
  type AiFeatureAvailability,
  getPolicyBlockedReasonKeys,
} from '@webapp/ai/policy/aiFeatureAvailability'

import { isPolicyReason, selectEngine } from './selectEngine'
import type { AiCapabilities, AiSelectedEngine, AiUnavailableReason } from './types'

// B's availability plus the reason codes (for the actions) and the selected engine
export type AiEngineFeatureAvailability = AiFeatureAvailability & {
  reasons: AiUnavailableReason[]
  engine: AiSelectedEngine | null
  // false for requests without a survey (Help): the survey policy tab cannot help them
  surveyScoped: boolean
}

export type AiUnavailableAction = 'turnOnLocalServer' | 'chooseModel' | 'configureProvider' | 'retry' | 'changePolicy'

// no engine, no badge
export const NO_DATA_LOCATION: AiDataLocation = Object.freeze({
  hostingClass: null,
  provider: null,
  model: null,
  engine: null,
})

const ACTIONS: Record<AiUnavailableReason, AiUnavailableAction> = {
  localServerNotEnabled: 'turnOnLocalServer',
  localServerUnreachable: 'retry',
  localServerNoModel: 'chooseModel',
  gatewayNotConfigured: 'configureProvider',
  policyForbidsCloud: 'changePolicy',
  policyForbidsOrgHosted: 'changePolicy',
  policyForbidsAll: 'changePolicy',
}

/**
 * Returns the i18n key (common namespace) of a reason.
 * @param {AiUnavailableReason} reason - Reason.
 * @returns {string} The key.
 */
export const getAiUnavailableReasonKey = (reason: AiUnavailableReason): string => `aiEngine.unavailable.${reason}`

/**
 * Returns the action that would fix a reason.
 * @param {AiUnavailableReason} reason - Reason.
 * @returns {AiUnavailableAction} The action.
 */
export const getAiUnavailableAction = (reason: AiUnavailableReason): AiUnavailableAction => ACTIONS[reason]

/**
 * Returns where the data goes with the engine (the props of B's AiDataLocationBadge).
 * @param {AiSelectedEngine} engine - Engine.
 * @returns {AiDataLocation} The location.
 */
export const toDataLocation = (engine: AiSelectedEngine): AiDataLocation =>
  engine.id === 'gateway'
    ? { hostingClass: engine.hostingClass, provider: engine.label || null, model: engine.model, engine: null }
    : { hostingClass: engine.hostingClass, provider: null, model: engine.model, engine: engine.label }

const notAvailable = ({
  status,
  reasons = [],
  reasonKeys = [],
  surveyScoped,
}: {
  status: AiFeatureAvailability['status']
  reasons?: AiUnavailableReason[]
  reasonKeys?: string[]
  surveyScoped: boolean
}): AiEngineFeatureAvailability => ({
  status,
  location: NO_DATA_LOCATION,
  reasonKeys,
  reasons,
  engine: null,
  surveyScoped,
})

/**
 * Returns the availability of a feature.
 * @param {object} params - Parameters.
 * @param {boolean} params.enabled - Feature switched on (instance, user, category).
 * @param {AiPolicy|null} params.effective - Effective policy (null while loading).
 * @param {AiDataClass} params.dataClass - Data class of the request.
 * @param {boolean} params.surveyScoped - The request belongs to a survey (false: checked against the instance ceilings).
 * @param {AiCapabilities} params.capabilities - Capabilities.
 * @param {boolean} params.preferLocal - Local first (preference after the consent decision).
 * @returns {AiEngineFeatureAvailability} The availability.
 */
export const getAiEngineFeatureAvailability = ({
  enabled,
  effective,
  dataClass,
  surveyScoped,
  capabilities,
  preferLocal,
}: {
  enabled: boolean
  effective: AiPolicy | null
  dataClass: AiDataClass
  surveyScoped: boolean
  capabilities: AiCapabilities
  preferLocal: boolean
}): AiEngineFeatureAvailability => {
  if (!enabled || !effective) return notAvailable({ status: 'disabled', surveyScoped })
  const selection = selectEngine({ effective, dataClass, capabilities, prefs: { preferLocal } })
  if ('engine' in selection) {
    const { engine } = selection
    return { status: 'available', location: toDataLocation(engine), reasonKeys: [], reasons: [], engine, surveyScoped }
  }
  const reasons = selection.unavailable
  if (reasons.every(isPolicyReason)) {
    // only a policy change helps: B's message says what the policy allows
    const reasonKeys = getPolicyBlockedReasonKeys({ dataClass, allowed: effective[dataClass], surveyScoped })
    return notAvailable({ status: 'policyBlocked', reasons, reasonKeys, surveyScoped })
  }
  return notAvailable({ status: 'noEngine', reasons, reasonKeys: reasons.map(getAiUnavailableReasonKey), surveyScoped })
}
