import axios from 'axios'

import * as Survey from '@core/survey/survey'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { LoaderActions } from '@webapp/store/ui/loader'
import { NotificationActions } from '@webapp/store/ui/notification'

import * as SurveyState from '../state'

import { surveyDelete } from './actionTypes'

export const deleteSurvey = (navigate) => async (dispatch, getState) => {
  dispatch(LoaderActions.showLoader())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  await axios.delete(`/api/survey/${surveyId}`)

  await dispatch({ type: surveyDelete, surveyInfo })

  // Navigate to survey/template list
  const moduleDestination = Survey.isTemplate(surveyInfo) ? homeModules.templateList : homeModules.surveyList
  navigate(appModuleUri(moduleDestination))

  await dispatch(LoaderActions.hideLoader())

  await dispatch(
    NotificationActions.notifyInfo({
      key: 'homeView.surveyDeleted',
      params: { surveyName: Survey.getName(surveyInfo) },
    })
  )
}
