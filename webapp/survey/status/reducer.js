import {exportReducer} from '@webapp/utils/reduxUtils'

import {appUserLogout} from '@webapp/app/actions'

import {
  surveyCreate,
  surveyDefsLoad,
  surveyDefsReset,
  surveyDelete,
  surveyUpdate,
} from '../actions'

import * as SurveyState from '../surveyState'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsReset]: SurveyState.resetDefsFetched,

  [surveyDefsLoad]: (state, {draft}) =>
    SurveyState.assocDefsFetched(draft)(state),
}

export default exportReducer(actionHandlers)
