import * as UserValidator from '@core/user/userValidator'
import * as UserInvite from '@core/user/userInvite'

import * as actionTypes from './actionTypes'

export const resetUserInvite = () => (dispatch) => dispatch({ type: actionTypes.USER_INVITE_RESET })

export const validateUserInvite = async (userInvite) => {
  const validation = await UserValidator.validateInvitation(userInvite)
  const userInviteValidated = UserInvite.assocValidation(validation)(userInvite)
  return userInviteValidated
}

export const updateUserInvite = ({ userInviteUpdated }) => async (dispatch) => {
  const userInviteValidated = await validateUserInvite(userInviteUpdated)
  dispatch({
    type: actionTypes.USER_INVITE_UPDATE,
    userInvite: userInviteValidated,
  })
}
