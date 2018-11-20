import { exportReducer } from '../../../appUtils/reduxUtils'
import { recordsListInit } from './actions'

const actionHandlers = {

  [recordsListInit]: (state, {offset, limit, count, list}) => ({...state, offset, limit, count, list})
}

export default exportReducer(actionHandlers)