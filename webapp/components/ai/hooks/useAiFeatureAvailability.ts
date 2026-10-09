import { useMemo } from 'react'

import { type AiDataClass, getAiFeature } from '@common/ai/features'
import * as User from '@core/user/user'

import { isCapabilitiesLoadedForUser } from '@webapp/ai/engines/capabilities'
import { getAiCapabilitiesStore } from '@webapp/ai/engines/capabilitiesStore'
import {
  type AiEngineFeatureAvailability,
  getAiEngineFeatureAvailability,
} from '@webapp/ai/engines/featureAvailability'
import { getEffectivePreferLocal, loadLocalServerConsent } from '@webapp/ai/engines/localServerConsent'
import { getBrowserStorage } from '@webapp/ai/engines/localServerSettings'
import { isSurveyScopedFeature, resolveEffectivePolicy } from '@webapp/ai/policy/aiFeatureAvailability'
import { getCeilingsFromSettings } from '@webapp/ai/policy/policyContextLoader'
import { useSurveyAiPolicy } from '@webapp/ai/policy/useSurveyAiPolicy'
import { useSurveyId } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import { useAiCapabilities } from './useAiCapabilities'
import { getAiSettingsSnapshot, useAiFeatureEnabled } from './useAiFeatureEnabled'

type AiSettingsSnapshot = {
  policyCeilings?: unknown
  // features turned off on the server (AI_FEATURE_FLAGS, A)
  disabledFeatures?: string[]
}

/**
 * Returns whether the AI feature is hidden, usable or blocked, which engine a click would use and where its data
 * goes (from the engine selection, with the same inputs as resolveModel).
 * @param {string} feature - Feature key (common/ai/features).
 * @param {object} [options] - Options.
 * @param {AiDataClass} [options.dataClass] - Data class of the request (default: the feature's; the assistant passes its conversation's).
 * @returns {AiEngineFeatureAvailability} The availability.
 */
export const useAiFeatureAvailability = (
  feature: string,
  { dataClass }: { dataClass?: AiDataClass } = {}
): AiEngineFeatureAvailability => {
  const definition = getAiFeature(feature)
  // re-renders on every settings change, so the snapshot below is current
  const categoryEnabled = useAiFeatureEnabled(definition?.category ?? null)
  const settings = getAiSettingsSnapshot() as AiSettingsSnapshot | null
  // useAiFeatureEnabled checks the category; one feature of it may still be off on the server
  const enabled = categoryEnabled && !(settings?.disabledFeatures ?? []).includes(feature)
  const surveyScoped = isSurveyScopedFeature(feature)
  const surveyId = useSurveyId()
  const { state, error } = useSurveyAiPolicy({ skip: !enabled || !surveyScoped })
  const capabilities = useAiCapabilities()
  const user = useUser()
  const userUuid = user ? (User.getUuid(user) ?? null) : null
  const requestDataClass = dataClass ?? definition?.dataClass ?? 'data'
  // without a survey (Help) only the instance ceilings apply; a survey policy error fails closed
  const settingsCeilings = useMemo(() => (settings ? getCeilingsFromSettings(settings) : null), [settings])
  const ceilings = capabilities.instance.policyCeilings ?? settingsCeilings
  const effective = resolveEffectivePolicy({ surveyScoped, state, error, ceilings })

  // the empty snapshot before the first load must not read as "no engine": nothing is shown until it is loaded
  const loaded = isCapabilitiesLoadedForUser(getAiCapabilitiesStore(), userUuid)

  return useMemo(() => {
    const localSettings = getAiCapabilitiesStore().getLocalSettings()
    const consent = localSettings.enabled
      ? loadLocalServerConsent({
          storage: getBrowserStorage(),
          userUuid,
          surveyId: surveyScoped ? surveyId : undefined,
          baseUrl: capabilities.localServer.baseUrl ?? '',
        })
      : null
    return getAiEngineFeatureAvailability({
      enabled: enabled && loaded,
      effective,
      dataClass: requestDataClass,
      surveyScoped,
      capabilities,
      preferLocal: getEffectivePreferLocal({ settings: localSettings, consent }),
    })
  }, [capabilities, effective, enabled, loaded, requestDataClass, surveyId, surveyScoped, userUuid])
}
