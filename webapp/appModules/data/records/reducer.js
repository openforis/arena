import { exportReducer } from '../../../appUtils/reduxUtils'
import { recordsListInit, recordsListUpdate } from './actions'

const actionHandlers = {

  [recordsListInit]: (state, {offset, limit, count, list}) => ({...state, offset, limit, count, list}),

  [recordsListUpdate]: (state, {offset, list}) => ({...state, offset, list}),
}

export default exportReducer(actionHandlers)