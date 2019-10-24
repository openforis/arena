import { exportReducer } from '@webapp/utils/reduxUtils'

import * as TableViewsState from './tableViewsState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { tableViewsListUpdate } from './actions'

const actionHandlers = {

  // reset form
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [tableViewsListUpdate]: (state, { type, ...actionProps }) => TableViewsState.assocListUpdateProps(actionProps)(state),
}

export default exportReducer(actionHandlers)
