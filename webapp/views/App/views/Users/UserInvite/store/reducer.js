import initialState from './initialState'
import * as actionTypes from './actionTypes'

export default (state, action) => {
  switch (action.type) {
    case actionTypes.USER_INVITE_UPDATE:
      return action.userInvite
    case actionTypes.USER_INVITE_RESET:
    default:
      return initialState
  }
}
