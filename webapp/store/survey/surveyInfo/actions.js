import axios from 'axios'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import * as NotificationState from '@webapp/app/appNotification/appNotificationState'

import * as LoaderActions from '@webapp/app/actions'
import * as NotificationActions from '@webapp/app/appNotification/actions'
import * as SurveyActions from '../actions'
import * as SurveyState from '../state'

export const surveyInfoUpdate = 'survey/info/update'
export const surveyInfoValidationUpdate = 'survey/info/validation/update'

export const updateSurveyInfoProps = (props) => async (dispatch, getState) => {
  dispatch(LoaderActions.showAppLoader())

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.put(`/api/survey/${surveyId}/info`, props)

  const surveyInfo = Survey.getSurveyInfo(data)
  if (Validation.isObjValid(surveyInfo)) {
    dispatch(NotificationActions.showNotification('common.saved'))
    dispatch({ type: surveyInfoUpdate, surveyInfo })
    dispatch(SurveyActions.resetSurveyDefs())
  } else {
    dispatch(NotificationActions.showNotification('common.formContainsErrors', null, NotificationState.severity.error))
    dispatch({
      type: surveyInfoValidationUpdate,
      validation: Validation.getValidation(surveyInfo),
    })
  }

  dispatch(LoaderActions.hideAppLoader())
}
