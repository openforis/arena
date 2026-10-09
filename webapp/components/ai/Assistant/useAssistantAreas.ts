import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import * as Survey from '@core/survey/survey'

import { AiFeatureCategory } from '@common/ai/features'

import { useAiFeatureAvailability } from '@webapp/components/ai/hooks/useAiFeatureAvailability'
import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { useSurveyInfo } from '@webapp/store/survey'
import * as SurveyStatusState from '@webapp/store/survey/status/state'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { useAnalysisAreaStatus } from './analysis/useAnalysisArea'
import { getDesignAreaStatus, getHelpAreaStatus, parseAppPath, type AssistantAreaStatus } from './assistantAreas'

export type AssistantAreasInfo = { statuses: AssistantAreaStatus[]; module: string | null; subModule: string | null }

/**
 * Returns the status of every area (tab order) and the current app module.
 * @returns {AssistantAreasInfo} Statuses and module.
 */
export const useAssistantAreas = (): AssistantAreasInfo => {
  const { pathname } = useLocation()
  const designAvailability = useAiFeatureAvailability('assistantDesign')
  const helpAvailability = useAiFeatureAvailability('chatbot')
  const designEnabled = useAiFeatureEnabled(AiFeatureCategory.assistant)
  const helpEnabled = useAiFeatureEnabled(AiFeatureCategory.chat)
  const analysisStatus = useAnalysisAreaStatus()
  const surveyInfo = useSurveyInfo()
  const canEditSurvey = useAuthCanEditSurvey()
  const hasDraftSurvey = useSelector(
    (state: any) => SurveyStatusState.isFetched(state) && SurveyStatusState.isDraft(state)
  )
  const statuses = [
    getDesignAreaStatus({
      categoryEnabled: designEnabled,
      surveyOpen: Survey.isValid(surveyInfo),
      canEditSurvey,
      hasDraftSurvey,
      availability: designAvailability,
    }),
    analysisStatus,
    getHelpAreaStatus({ categoryEnabled: helpEnabled, availability: helpAvailability }),
  ]
  return { statuses, ...parseAppPath(pathname) }
}
