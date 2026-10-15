import { createContext, useContext } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import * as Survey from '@core/survey/survey'

import { AiFeatureCategory } from '@common/ai/features'

import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { useSurveyInfo } from '@webapp/store/survey'
import * as SurveyStatusState from '@webapp/store/survey/status/state'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { useAnalysisAreaStatus } from './analysis/useAnalysisArea'
import { useCleaningAreaStatus } from './cleaning/useCleaningArea'
import { useAssistantFeatureAvailability } from './useAssistantFeatureAvailability'
import { getDesignAreaStatus, getHelpAreaStatus, parseAppPath, type AssistantAreaStatus } from './assistantAreas'

export type AssistantAreasInfo = { statuses: AssistantAreaStatus[]; module: string | null; subModule: string | null }

const AssistantAreasContext = createContext<AssistantAreasInfo | null>(null)

export const AssistantAreasContextProvider = AssistantAreasContext.Provider

/**
 * Computes the status of every area (tab order) and the current app module: the provider of the context calls it once
 * for the header button, the panel host and the panel.
 * @returns {AssistantAreasInfo} Statuses and module.
 */
export const useComputeAssistantAreas = (): AssistantAreasInfo => {
  const { pathname } = useLocation()
  const design = useAssistantFeatureAvailability('assistantDesign')
  const help = useAssistantFeatureAvailability('chatbot')
  const designEnabled = useAiFeatureEnabled(AiFeatureCategory.assistantDesign)
  const helpEnabled = useAiFeatureEnabled(AiFeatureCategory.chat)
  const analysisStatus = useAnalysisAreaStatus()
  const cleaningStatus = useCleaningAreaStatus()
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
      availability: design.availability,
      canSwitchProvider: design.canSwitchProvider,
    }),
    analysisStatus,
    cleaningStatus,
    getHelpAreaStatus({
      categoryEnabled: helpEnabled,
      availability: help.availability,
      canSwitchProvider: help.canSwitchProvider,
    }),
  ]
  return { statuses, ...parseAppPath(pathname) }
}

/**
 * Returns the status of every area (tab order) and the current app module, computed once by AssistantAreasProvider.
 * @returns {AssistantAreasInfo} Statuses and module.
 */
export const useAssistantAreas = (): AssistantAreasInfo => {
  const areas = useContext(AssistantAreasContext)
  if (!areas) throw new Error('useAssistantAreas needs an AssistantAreasProvider above it')
  return areas
}
