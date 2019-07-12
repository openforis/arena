import { exportReducer } from '../../../../utils/reduxUtils'

import { appUserLogout } from '../../../../app/actions'
import { surveyDelete, surveyUpdate } from '../../../../survey/actions'

import { recordsListInit, recordsListUpdate } from './actions'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [recordsListInit]: (state, {offset, limit, count, list, nodeDefKeys}) =>
    ({...state, offset, limit, count, list, nodeDefKeys}),

  [recordsListUpdate]: (state, {offset, list}) => ({...state, offset, list}),
}

export default exportReducer(actionHandlers)