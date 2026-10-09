import { useCallback } from 'react'
import { useStore } from 'react-redux'

import * as Authorizer from '@core/auth/authorizer'

import type { AiCurrentView, AiToolContext } from '@webapp/ai/tools/types'
import * as SurveyState from '@webapp/store/survey/state'
import { useI18nT, useLang } from '@webapp/store/system'
import { SurveyFormState } from '@webapp/store/ui/surveyForm'
import * as UserState from '@webapp/store/user/state'

import { parseAppPath, type AssistantArea } from './assistantAreas'

/**
 * Reads the current view (module and selected item) for the view_getCurrent tool.
 * @param {Function} getState - Redux getState.
 * @returns {AiCurrentView} The view.
 */
const getCurrentView = (getState: () => any): AiCurrentView => {
  const { module, subModule } = parseAppPath(window.location.pathname)
  const selectedNodeDefUuid =
    module === 'designer' ? (SurveyFormState.getFormActiveNodeDefUuid(getState()) ?? null) : null
  return { module, subModule, selectedNodeDefUuid }
}

/**
 * Returns a factory of the tool context of a turn (read from the store when the turn starts).
 * @returns {Function} (area) => AiToolContext.
 */
export const useAssistantToolContext = (): ((area: AssistantArea) => AiToolContext) => {
  const store = useStore()
  const t = useI18nT({ unescapeHtml: true })
  const uiLang = useLang()
  return useCallback(
    (area: AssistantArea): AiToolContext => {
      const { getState, dispatch } = store
      const state = getState()
      const user = UserState.getUser(state)
      const surveyInfo = SurveyState.getSurveyInfo(state)
      return {
        getState,
        dispatch,
        user,
        // the Help area sends no survey content (deviation 9)
        survey: area === 'help' ? null : SurveyState.getSurvey(state),
        cycle: SurveyState.getSurveyCycleKey(state) ?? null,
        lang: SurveyState.getSurveyPreferredLang(state) ?? uiLang,
        uiLang,
        // runAssistantTurn replaces both with the turn's own
        signal: new AbortController().signal,
        onChangeSet: () => undefined,
        canViewSurvey: Boolean(surveyInfo) && Authorizer.canViewSurvey(user, surveyInfo),
        canEditSurvey: Boolean(surveyInfo) && Authorizer.canEditSurvey(user, surveyInfo),
        getCurrentView: () => getCurrentView(getState),
        t,
      }
    },
    [store, t, uiLang]
  )
}
