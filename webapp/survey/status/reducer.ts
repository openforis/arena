import { exportReducer } from '../../utils/reduxUtils'

import { appUserLogout } from '../../app/actions'

import { surveyCreate, surveyDefsLoad, surveyDefsReset, surveyDelete, surveyUpdate } from '../actions'

import * as SurveyState from '../surveyState'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsReset]: SurveyState.resetDefsFetched,

  [surveyDefsLoad]: (state, { draft }) => SurveyState.assocDefsFetched(draft)(state),
}

export default exportReducer(actionHandlers)