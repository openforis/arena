import { assocActionProps, exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate } from '@webapp/survey/actions'
import { surveyCreateNewSurveyUpdate } from './actions'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [surveyCreate]: (_state, _) => ({}),

  [surveyCreateNewSurveyUpdate]: assocActionProps,
}

export default exportReducer(actionHandlers)
