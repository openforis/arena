import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { userUpdate, userProfilePictureUpdate, userStateReset } from './actions'
import * as UserViewState from './userViewState'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [userStateReset]: () => ({}),

  [userUpdate]: (state, { user }) => UserViewState.assocUser(user)(state),

  [userProfilePictureUpdate]: (state, { profilePicture }) => UserViewState.assocProfilePicture(profilePicture)(state),
}

export default exportReducer(actionHandlers)
