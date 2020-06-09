import { exportReducer } from '@webapp/utils/reduxUtils'

import { userUpdate, userProfilePictureUpdate, userStateReset } from './actions'
import * as UserViewState from './userViewState'
import { SystemActions } from '@webapp/store/system'

const actionHandlers = {
  // Reset state
  [SystemActions.SYSTEM_RESET]: () => ({}),
  [userStateReset]: () => ({}),

  [userUpdate]: (state, { user }) => UserViewState.assocUser(user)(state),

  [userProfilePictureUpdate]: (state, { profilePicture }) => UserViewState.assocProfilePicture(profilePicture)(state),
}

export default exportReducer(actionHandlers)
