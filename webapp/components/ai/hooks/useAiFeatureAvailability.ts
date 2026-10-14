import { useMemo } from 'react'

import { type AiDataClass, getAiFeature, getAiFeatureMinDataClass } from '@common/ai/features'
import * as User from '@core/user/user'

import { isCapabilitiesLoadedForUser } from '@webapp/ai/engines/capabilities'
import { getAiCapabilitiesStore } from '@webapp/ai/engines/capabilitiesStore'
import {
  type AiEngineFeatureAvailability,
  getAiEngineFeatureAvailability,
} from '@webapp/ai/engines/featureAvailability'
import { type AiFeatureSwitches, isAiFeatureEnabledInSettings } from '@webapp/ai/engines/featureSwitches'
import { isSurveyScopedFeature, resolveEffectivePolicy } from '@webapp/ai/policy/aiFeatureAvailability'
import { getCeilingsFromSettings } from '@webapp/ai/policy/policyContextLoader'
import { useSurveyAiPolicy } from '@webapp/ai/policy/useSurveyAiPolicy'
import { useUser } from '@webapp/store/user'

import { useAiCapabilities } from './useAiCapabilities'
import { getAiSettingsSnapshot, useAiFeatureEnabled } from './useAiFeatureEnabled'

type AiSettingsSnapshot = AiFeatureSwitches & { policyCeilings?: unknown }

/**
 * Returns whether the AI feature is hidden, usable or blocked, which engine a click would use and where its data
 * goes (from the engine selection, with the same inputs as resolveModel).
 * @param {string} feature - Feature key (common/ai/features).
 * @param {object} [options] - Options.
 * @param {AiDataClass} [options.dataClass] - Data class of the request (default: the feature's lowest; the assistant passes its conversation's).
 * @param {string} [options.providerId] - The conversation's provider (default: the user's default provider).
 * @returns {AiEngineFeatureAvailability} The availability.
 */
export const useAiFeatureAvailability = (
  feature: string,
  { dataClass, providerId }: { dataClass?: AiDataClass; providerId?: string } = {}
): AiEngineFeatureAvailability => {
  const definition = getAiFeature(feature)
  // re-renders on every settings change, so the snapshot below is current
  const categoryEnabled = useAiFeatureEnabled(definition?.category ?? null)
  const settings = getAiSettingsSnapshot() as AiSettingsSnapshot | null
  // useAiFeatureEnabled checks the category; one feature of it may still be off on the server
  const enabled = categoryEnabled && isAiFeatureEnabledInSettings(settings, feature)
  const surveyScoped = isSurveyScopedFeature(feature)
  const { state, error } = useSurveyAiPolicy({ skip: !enabled || !surveyScoped })
  const capabilities = useAiCapabilities()
  const user = useUser()
  const userUuid = user ? (User.getUuid(user) ?? null) : null
  const requestDataClass = dataClass ?? getAiFeatureMinDataClass(feature)
  // without a survey (Help) only the instance ceilings apply; a survey policy error fails closed
  const settingsCeilings = useMemo(() => (settings ? getCeilingsFromSettings(settings) : null), [settings])
  const ceilings = capabilities.instance.policyCeilings ?? settingsCeilings
  const effective = resolveEffectivePolicy({ surveyScoped, state, error, ceilings })

  // the empty snapshot before the first load must not read as "no engine": nothing is shown until it is loaded
  const loaded = isCapabilitiesLoadedForUser(getAiCapabilitiesStore(), userUuid)

  return useMemo(
    () =>
      getAiEngineFeatureAvailability({
        enabled: enabled && loaded,
        effective,
        dataClass: requestDataClass,
        surveyScoped,
        capabilities,
        providerId,
      }),
    [capabilities, effective, enabled, loaded, providerId, requestDataClass, surveyScoped]
  )
}
