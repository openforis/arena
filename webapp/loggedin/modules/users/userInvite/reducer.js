import { exportReducer } from '@webapp/utils/reduxUtils'

import { userInviteStateReset, userInviteUpdate } from './actions'
import * as UserInviteViewState from './userInviteViewState'
import { SystemActions } from '@webapp/store/system'

const actionHandlers = {
  // Reset state
  [SystemActions.SYSTEM_RESET]: () => ({}),
  [userInviteStateReset]: () => ({}),

  [userInviteUpdate]: (state, { userInvite }) => UserInviteViewState.assocUserInvite(userInvite)(state),
}

export default exportReducer(actionHandlers)
