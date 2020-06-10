import { exportReducer } from '@webapp/utils/reduxUtils'

import * as SystemActions from '../actions'

const actionHandlers = {
  [SystemActions.SYSTEM_INIT]: (state, { i18n }) => i18n || state,
}

export default exportReducer(actionHandlers)
