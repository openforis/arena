import { exportReducer } from '@webapp/utils/reduxUtils'

import { UserActions } from '@webapp/store/system'
import { userUpdate, userProfilePictureUpdate, userStateReset } from './actions'
import * as UserViewState from './userViewState'

const actionHandlers = {
  // Reset state
  [UserActions.APP_USER_LOGOUT]: () => ({}),
  [userStateReset]: () => ({}),

  [userUpdate]: (state, { user }) => UserViewState.assocUser(user)(state),

  [userProfilePictureUpdate]: (state, { profilePicture }) => UserViewState.assocProfilePicture(profilePicture)(state),
}

export default exportReducer(actionHandlers)
