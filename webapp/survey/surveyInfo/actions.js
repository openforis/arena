import axios from 'axios'

import Survey from '../../../common/survey/survey'
import Validator from '../../../common/validation/validator'

import * as AppState from '../../app/appState'
import * as SurveyState from '../surveyState'

import { hideAppLoader, showAppLoader, showNotificationMessage } from '../../app/actions'

export const surveyInfoUpdate = 'survey/info/update'
export const surveyInfoValidationUpdate = 'survey/info/validation/update'

export const updateSurveyInfoProps = props => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.put(`/api/survey/${surveyId}/info`, props)

  const surveyInfo = Survey.getSurveyInfo(data)
  if (Validator.isValid(surveyInfo)) {
    dispatch(showNotificationMessage('common.saved'))
    dispatch({ type: surveyInfoUpdate, surveyInfo })
  } else {
    dispatch(showNotificationMessage('common.formContainsErrors', null, AppState.notificationSeverity.error))
    dispatch({ type: surveyInfoValidationUpdate, validation: Validator.getValidation(surveyInfo) })
  }

  dispatch(hideAppLoader())
}
