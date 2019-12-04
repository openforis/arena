import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import * as TableViewsState from './tableViewsState'
import { tableViewsListUpdate } from './actions'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [tableViewsListUpdate]: (state, { type: _type, ...actionProps }) =>
    TableViewsState.assocListUpdateProps(actionProps)(state),
}

export default exportReducer(actionHandlers)
