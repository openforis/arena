import { exportReducer } from '../../utils/reduxUtils'

import * as TableViewsState from './tableViewsState'

import { appUserLogout } from '../../app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '../../survey/actions'
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
