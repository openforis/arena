import { assocActionProps, exportReducer } from '@webapp/utils/reduxUtils'

import { UserActions } from '@webapp/store/system'
import { SurveyActions } from '@webapp/store/survey'
import { surveyCreateNewSurveyUpdate } from './actions'

const actionHandlers = {
  [UserActions.APP_USER_LOGOUT]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),

  [surveyCreateNewSurveyUpdate]: assocActionProps,
}

export default exportReducer(actionHandlers)
