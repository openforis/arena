import { assocActionProps, exportReducer } from '@webapp/utils/reduxUtils'

import { SurveyActions } from '@webapp/store/survey'
import { surveyCreateNewSurveyUpdate } from './actions'
import { SystemActions } from '@webapp/store/system'

const actionHandlers = {
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),

  [surveyCreateNewSurveyUpdate]: assocActionProps,
}

export default exportReducer(actionHandlers)
