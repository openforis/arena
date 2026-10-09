import * as Survey from '@core/survey/survey'

import { getConversationDataClass } from '@webapp/ai/conversations/dataClass'
import { useAiFeatureAvailability } from '@webapp/components/ai/hooks/useAiFeatureAvailability'
import { useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanCleanseRecords } from '@webapp/store/user'

import type { AssistantAreaStatus } from '../assistantAreas'
import { getAnalysisAreaStatus, shouldShowRecordDataNotice } from './analysisArea'

/**
 * State of the Analysis tab (Explorer access = canCleanseRecords, as Authorizer.canUseExplorer).
 * @returns {AssistantAreaStatus} The tab state.
 */
export const useAnalysisAreaStatus = (): AssistantAreaStatus => {
  const surveyInfo = useSurveyInfo()
  const canUseExplorer = useAuthCanCleanseRecords()
  const availability = useAiFeatureAvailability('assistantAnalysis', { dataClass: 'schema' })
  return getAnalysisAreaStatus({ surveyOpen: Survey.isValid(surveyInfo), canUseExplorer, availability })
}

/**
 * Tells whether the conversation contains record data that no allowed engine may receive any more.
 * @param {object|null} conversation - The current conversation.
 * @returns {boolean} True to show the notice and disable the composer.
 */
export const useRecordDataNotice = (conversation: { dataClass?: unknown } | null): boolean => {
  const dataAvailability = useAiFeatureAvailability('assistantAnalysis', { dataClass: 'data' })
  return shouldShowRecordDataNotice({ conversationDataClass: getConversationDataClass(conversation), dataAvailability })
}
