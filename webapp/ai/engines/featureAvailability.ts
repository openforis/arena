/**
 * Availability of an AI feature from the engine selection: the engine a click would use and where the data goes,
 * or why its provider cannot be used. Same selectEngine inputs as resolveModel, so the badge names the engine used.
 */
import type { AiDataClass } from '@common/ai/features'
import { type AiPolicy, getAllowedLevel } from '@common/ai/policy'

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

export type AiUnavailableAction = 'retry' | 'changePolicy' | 'openSettings'

// no engine, no badge
export const NO_DATA_LOCATION: AiDataLocation = Object.freeze({
  hostingClass: null,
  provider: null,
  model: null,
  engine: null,
})

// what would fix each reason; the profile holds the provider list (add, test, make default)
const ACTIONS: Record<AiUnavailableReason, AiUnavailableAction[]> = {
  policyForbids: ['changePolicy'],
  notAvailable: ['retry', 'openSettings'],
  missingOnThisBrowser: ['openSettings'],
  notSetUp: ['openSettings'],
}

/**
 * Returns the i18n key (common namespace) of a reason.
 * @param {AiUnavailableReason} reason - Reason.
 * @returns {string} The key.
 */
export const getAiUnavailableReasonKey = (reason: AiUnavailableReason): string => `aiEngine.unavailable.${reason}`

/**
 * Returns the actions that would fix a reason.
 * @param {AiUnavailableReason} reason - Reason.
 * @returns {AiUnavailableAction[]} The actions, most direct first.
 */
export const getAiUnavailableReasonActions = (reason: AiUnavailableReason): AiUnavailableAction[] => ACTIONS[reason]

/**
 * Returns where the data goes with the engine (the props of B's AiDataLocationBadge).
 * @param {AiSelectedEngine} engine - Engine.
 * @returns {AiDataLocation} The location.
 */
export const toDataLocation = (engine: AiSelectedEngine): AiDataLocation =>
  engine.id === 'gateway'
    ? { hostingClass: engine.hostingClass, provider: engine.label || null, model: engine.model, engine: null }
    : { hostingClass: engine.hostingClass, provider: null, model: engine.model, engine: engine.label }

/**
 * Returns an availability without an engine.
 * @param {object} params - Parameters.
 * @param {string} params.status - Status.
 * @param {AiUnavailableReason[]} [params.reasons] - Reasons.
 * @param {string[]} [params.reasonKeys] - i18n keys of the texts.
 * @param {boolean} params.surveyScoped - The request belongs to a survey.
 * @returns {AiEngineFeatureAvailability} The availability.
 */
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
 * @param {string|null} [params.providerId] - The conversation's provider (default: the user's default).
 * @returns {AiEngineFeatureAvailability} The availability.
 */
export const getAiEngineFeatureAvailability = ({
  enabled,
  effective,
  dataClass,
  surveyScoped,
  capabilities,
  providerId,
}: {
  enabled: boolean
  effective: AiPolicy | null
  dataClass: AiDataClass
  surveyScoped: boolean
  capabilities: AiCapabilities
  providerId?: string | null
}): AiEngineFeatureAvailability => {
  if (!enabled || !effective) return notAvailable({ status: 'disabled', surveyScoped })
  const selection = selectEngine({ effective, dataClass, capabilities, providerId })
  if ('engine' in selection) {
    const { engine } = selection
    return { status: 'available', location: toDataLocation(engine), reasonKeys: [], reasons: [], engine, surveyScoped }
  }
  const reasons = selection.unavailable
  if (reasons.every(isPolicyReason)) {
    // only a policy change helps: B's message says what the policy allows
    const reasonKeys = getPolicyBlockedReasonKeys({
      dataClass,
      allowed: getAllowedLevel(effective, dataClass),
      surveyScoped,
    })
    return notAvailable({ status: 'policyBlocked', reasons, reasonKeys, surveyScoped })
  }
  return notAvailable({ status: 'noEngine', reasons, reasonKeys: reasons.map(getAiUnavailableReasonKey), surveyScoped })
}
