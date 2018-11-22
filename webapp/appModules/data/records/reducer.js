import { exportReducer } from '../../../appUtils/reduxUtils'
import { recordsListInit, recordsListUpdate } from './actions'

const actionHandlers = {

  [recordsListInit]: (state, {offset, limit, count, list, nodeDefKeys}) =>
    ({...state, offset, limit, count, list, nodeDefKeys}),

  [recordsListUpdate]: (state, {offset, list}) => ({...state, offset, list}),
}

export default exportReducer(actionHandlers)