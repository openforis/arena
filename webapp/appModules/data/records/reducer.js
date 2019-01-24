import { exportReducer } from '../../../appUtils/reduxUtils'

import { appUserLogout } from '../../../app/actions'

import { recordsListInit, recordsListUpdate } from './actions'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [recordsListInit]: (state, {offset, limit, count, list, nodeDefKeys}) =>
    ({...state, offset, limit, count, list, nodeDefKeys}),

  [recordsListUpdate]: (state, {offset, list}) => ({...state, offset, list}),
}

export default exportReducer(actionHandlers)