import { useMemo } from 'react'

import type { AiDataClass } from '@common/ai/features'

import {
  type AiEngineFeatureAvailability,
  getAiEngineFeatureAvailability,
} from '@webapp/ai/engines/featureAvailability'
import { useAiFeaturePolicy } from '@webapp/components/ai/hooks/useAiFeatureAvailability'

import { hasPickableProvider } from './providerChip/providerChipModel'

export type AssistantFeatureAvailability = {
  // availability with the user's default provider
  availability: AiEngineFeatureAvailability
  // another provider can be picked in the chat (the area then opens even when the default cannot answer)
  canSwitchProvider: boolean
}

/**
 * Returns the availability of an assistant feature with the user's default provider, and whether the chat can
 * switch to a provider that is allowed.
 * @param {string} feature - Feature key (common/ai/features).
 * @param {object} [options] - Options.
 * @param {AiDataClass} [options.dataClass] - Data class of the request (default: the feature's lowest).
 * @returns {AssistantFeatureAvailability} The availability and the switch flag.
 */
export const useAssistantFeatureAvailability = (
  feature: string,
  { dataClass }: { dataClass?: AiDataClass } = {}
): AssistantFeatureAvailability => {
  const { enabled, effective, surveyScoped, capabilities, requestDataClass } = useAiFeaturePolicy(feature, {
    dataClass,
  })
  return useMemo(
    () => ({
      availability: getAiEngineFeatureAvailability({
        enabled,
        effective,
        dataClass: requestDataClass,
        surveyScoped,
        capabilities,
      }),
      canSwitchProvider: hasPickableProvider({ capabilities, effective, dataClass: requestDataClass, surveyScoped }),
    }),
    [capabilities, effective, enabled, requestDataClass, surveyScoped]
  )
}
