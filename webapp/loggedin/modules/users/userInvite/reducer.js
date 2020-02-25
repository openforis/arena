import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { userInviteStateReset, userInviteUpdate } from './actions'
import * as UserInviteViewState from './userInviteViewState'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [userInviteStateReset]: () => ({}),

  [userInviteUpdate]: (state, { userInvite }) => UserInviteViewState.assocUserInvite(userInvite)(state),
}

export default exportReducer(actionHandlers)
