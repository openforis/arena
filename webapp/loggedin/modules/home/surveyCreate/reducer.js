import { assocActionProps, exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { SurveyActions } from '@webapp/store/survey'
import { surveyCreateNewSurveyUpdate } from './actions'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),

  [surveyCreateNewSurveyUpdate]: assocActionProps,
}

export default exportReducer(actionHandlers)
