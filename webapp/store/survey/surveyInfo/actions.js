import axios from 'axios'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import * as NotificationState from '@webapp/app/appNotification/appNotificationState'

import { hideAppLoader, showAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import * as SurveyState from '../surveyState'
import { resetSurveyDefs } from '../actions'

export const surveyInfoUpdate = 'survey/info/update'
export const surveyInfoValidationUpdate = 'survey/info/validation/update'

export const updateSurveyInfoProps = props => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.put(`/api/survey/${surveyId}/info`, props)

  const surveyInfo = Survey.getSurveyInfo(data)
  if (Validation.isObjValid(surveyInfo)) {
    dispatch(showNotification('common.saved'))
    dispatch({ type: surveyInfoUpdate, surveyInfo })
    dispatch(resetSurveyDefs())
  } else {
    dispatch(showNotification('common.formContainsErrors', null, NotificationState.severity.error))
    dispatch({
      type: surveyInfoValidationUpdate,
      validation: Validation.getValidation(surveyInfo),
    })
  }

  dispatch(hideAppLoader())
}
