import { assocActionProps, exportReducer } from '../../../appUtils/reduxUtils'

import { appUserLogout } from '../../../app/actions'
import { surveyCreate } from '../../../survey/actions'
import { surveyCreateNewSurveyUpdate } from './actions'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [surveyCreate]: (state, _) => ({}),

  [surveyCreateNewSurveyUpdate]: assocActionProps,
}

export default exportReducer(actionHandlers)