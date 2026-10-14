import * as Survey from '@core/survey/survey'

import type { AiFeatureKey } from '@common/ai/features'

import { getConversationDataClass } from '@webapp/ai/conversations/dataClass'
import { useAiFeatureAvailability } from '@webapp/components/ai/hooks/useAiFeatureAvailability'
import { useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanCleanseRecords } from '@webapp/store/user'

import type { AssistantAreaStatus } from '../assistantAreas'
import { useAssistantFeatureAvailability } from '../useAssistantFeatureAvailability'
import { getAnalysisAreaStatus, shouldShowRecordDataNotice } from './analysisArea'

/**
 * State of the Analysis tab (Explorer access = canCleanseRecords, as Authorizer.canUseExplorer).
 * @returns {AssistantAreaStatus} The tab state.
 */
export const useAnalysisAreaStatus = (): AssistantAreaStatus => {
  const surveyInfo = useSurveyInfo()
  const canUseExplorer = useAuthCanCleanseRecords()
  const { availability, canSwitchProvider } = useAssistantFeatureAvailability('assistantAnalysis', {
    dataClass: 'schema',
  })
  return getAnalysisAreaStatus({
    surveyOpen: Survey.isValid(surveyInfo),
    canUseExplorer,
    availability,
    canSwitchProvider,
  })
}

/**
 * Tells whether the conversation contains record data that no allowed engine may receive any more.
 * @param {object|null} conversation - The current conversation.
 * @param {AiFeatureKey} feature - Gateway feature of the area shown (its data policy decides).
 * @param {string} [providerId] - The shown conversation's provider (default: the user's default).
 * @returns {boolean} True to show the notice and disable the composer.
 */
export const useRecordDataNotice = (
  conversation: { dataClass?: unknown } | null,
  feature: AiFeatureKey,
  providerId?: string
): boolean => {
  const dataAvailability = useAiFeatureAvailability(feature, { dataClass: 'data', providerId })
  return shouldShowRecordDataNotice({ conversationDataClass: getConversationDataClass(conversation), dataAvailability })
}
