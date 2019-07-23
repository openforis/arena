import { assocActionProps, exportReducer } from '../../../utils/reduxUtils'

import { userListInit, userListUpdate } from './actions'

const actionHandlers = {
  [userListInit]: (state, { offset, limit, count, list }) =>
    ({ ...state, offset, limit, count, list }),

  [userListUpdate]: assocActionProps,
}

export default exportReducer(actionHandlers)
