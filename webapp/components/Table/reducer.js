import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActions } from '@webapp/store/system'
import { SurveyActions } from '@webapp/store/survey'
import * as TableViewsState from './tableViewsState'
import { tableViewsListUpdate } from './actions'

const actionHandlers = {
  // Reset form
  [SystemActions.SYSTEM_RESET]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [tableViewsListUpdate]: (state, { type: _type, ...actionProps }) =>
    TableViewsState.assocListUpdateProps(actionProps)(state),
}

export default exportReducer(actionHandlers)
