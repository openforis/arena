import { assocActionProps, exportReducer } from '../../../../utils/reduxUtils'

import { usersUpdate } from './actions'

const actionHandlers = {
  [usersUpdate]: assocActionProps,
}

export default exportReducer(actionHandlers)