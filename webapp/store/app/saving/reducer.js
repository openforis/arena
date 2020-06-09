import { exportReducer } from '@webapp/utils/reduxUtils'

import * as AppSavingActions from './actions'
import * as AppSavingState from './state'

const actionHandlers = {
  [AppSavingActions.APP_SAVING_UPDATE]: (state, { saving }) => AppSavingState.assocSaving(saving),
}

export default exportReducer(actionHandlers, false)
