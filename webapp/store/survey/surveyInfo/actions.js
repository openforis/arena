import axios from 'axios'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import { LoaderActions } from '@webapp/store/ui/loader'
import { NotificationActions } from '@webapp/store/ui/notification'

// the defs module alone: the actions index pulls in the whole component tree (jsdom), which the unit bundle cannot load
import { resetSurveyDefs } from '../actions/defs'
import * as SurveyState from '../state'

export const surveyInfoUpdate = 'survey/info/update'
export const surveyInfoValidationUpdate = 'survey/info/validation/update'

export const updateSurveyInfoProps = (props) => async (dispatch, getState) => {
  dispatch(LoaderActions.showLoader())

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.put(`/api/survey/${surveyId}/info`, props)

  const surveyInfo = Survey.getSurveyInfo(data)
  if (Validation.isObjValid(surveyInfo)) {
    dispatch(NotificationActions.notifyInfo({ key: 'common.saved' }))
    dispatch({ type: surveyInfoUpdate, surveyInfo })
    dispatch(resetSurveyDefs())
  } else {
    dispatch(NotificationActions.notifyError({ key: 'common.formContainsErrors' }))
    dispatch({
      type: surveyInfoValidationUpdate,
      validation: Validation.getValidation(surveyInfo),
    })
  }

  dispatch(LoaderActions.hideLoader())
}
