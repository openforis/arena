import { exportReducer } from '@webapp/utils/reduxUtils'

import { UserActions } from '@webapp/store/user'
import { userInviteStateReset, userInviteUpdate } from './actions'
import * as UserInviteViewState from './userInviteViewState'

const actionHandlers = {
  // Reset state
  [UserActions.APP_USER_LOGOUT]: () => ({}),
  [userInviteStateReset]: () => ({}),

  [userInviteUpdate]: (state, { userInvite }) => UserInviteViewState.assocUserInvite(userInvite)(state),
}

export default exportReducer(actionHandlers)
