import axios from 'axios'

import Survey from '../../../common/survey/survey'
import Validation from '../../../common/validation/validation'

import * as AppState from '../../app/appState'
import * as SurveyState from '../surveyState'

import { hideAppLoader, showAppLoader, showNotificationMessage } from '../../app/actions'
import { resetSurveyDefs } from '../actions'

export const surveyInfoUpdate = 'survey/info/update'
export const surveyInfoValidationUpdate = 'survey/info/validation/update'

export const updateSurveyInfoProps = props => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.put(`/api/survey/${surveyId}/info`, props)

  const surveyInfo = Survey.getSurveyInfo(data)
  if (Validation.isObjValid(surveyInfo)) {
    dispatch(showNotificationMessage('common.saved'))
    dispatch({ type: surveyInfoUpdate, surveyInfo })
    dispatch(resetSurveyDefs())
  } else {
    dispatch(showNotificationMessage('common.formContainsErrors', null, AppState.notificationSeverity.error))
    dispatch({ type: surveyInfoValidationUpdate, validation: Validation.getValidation(surveyInfo) })
  }

  dispatch(hideAppLoader())
}
