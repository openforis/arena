import { exportReducer } from '@webapp/utils/reduxUtils'

import { UserActions } from '@webapp/store/user'
import { SurveyActions } from '@webapp/store/survey'
import * as TableViewsState from './tableViewsState'
import { tableViewsListUpdate } from './actions'

const actionHandlers = {
  // Reset form
  [UserActions.USER_LOGOUT]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [tableViewsListUpdate]: (state, { type: _type, ...actionProps }) =>
    TableViewsState.assocListUpdateProps(actionProps)(state),
}

export default exportReducer(actionHandlers)
