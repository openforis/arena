import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'

import { buildRowContextDraft } from '@common/ai/prompts/cleaningRowContext'
import { toValidationListItems } from '@webapp/ai/tools/cleaning/validationList'
import { useAiFeatureAvailability } from '@webapp/components/ai/hooks/useAiFeatureAvailability'
import { DataExplorerState } from '@webapp/store/dataExplorer'
import { useSurvey, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanCleanseRecords, useUser } from '@webapp/store/user'

import type { AssistantAreaStatus } from '../assistantAreas'
import { useAssistantOpenWithDraft } from '../useAssistantPanel'
import { getCleaningAreaStatus } from './cleaningArea'

/**
 * State of the Cleaning tab (cleanse permission and an engine allowed for `data`).
 * @returns {AssistantAreaStatus} The tab state.
 */
export const useCleaningAreaStatus = (): AssistantAreaStatus => {
  const surveyInfo = useSurveyInfo()
  const canCleanseRecords = useAuthCanCleanseRecords()
  const availability = useAiFeatureAvailability('assistantCleaning', { dataClass: 'data' })
  return getCleaningAreaStatus({ surveyOpen: Survey.isValid(surveyInfo), canCleanseRecords, availability })
}

/**
 * Whether the Explorer is in edit mode (one of the views where the Cleaning area is selected).
 * @returns {boolean} The edit mode.
 */
export const useExplorerEditMode = (): boolean => useSelector(DataExplorerState.isEditMode)

/**
 * Returns a function that opens the Cleaning area in a new conversation with a validation report row pre-filled.
 * @returns {Function} (row) => void.
 */
export const useAskAssistantAboutRow = () => {
  const survey = useSurvey()
  const user = useUser()
  const lang = useSurveyPreferredLang()
  const i18n = useI18n()
  const openWithDraft = useAssistantOpenWithDraft()

  return useCallback(
    (row: any) => {
      const [item] = toValidationListItems({ survey, rows: [row], user, i18n, lang })
      const draft = buildRowContextDraft({
        question: i18n.t('aiCleaning.rowAction.question'),
        context: {
          recordUuid: item.recordUuid,
          recordKeys: item.recordKeys,
          nodeUuid: item.nodeUuid,
          path: item.path,
          messages: item.messages,
        },
      })
      openWithDraft({ area: 'cleaning', draft })
    },
    [i18n, lang, openWithDraft, survey, user]
  )
}
