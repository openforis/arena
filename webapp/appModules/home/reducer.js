import { assocActionProps, dissocStateProps, exportReducer } from '../../appUtils/reduxUtils'

import { appUserLogout } from '../../app/actions'
import { surveyCreate } from '../../survey/actions'
import { homeNewSurveyUpdate } from './actions'
import { homeSurveysUpdate } from './actions'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [surveyCreate]: (state, _) => dissocStateProps(state, ['newSurvey']),

  [homeNewSurveyUpdate]: assocActionProps,

  [homeSurveysUpdate]: assocActionProps,
}

export default exportReducer(actionHandlers)