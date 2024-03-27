import * as actionTypes from './actionTypes'
import initialState from './initialState'

export default (state, action) => {
  switch (action.type) {
    case actionTypes.USER_INIT:
      return {
        ...state,
        error: null,
        initialUser: action.payload,
        user: { ...state.user, ...action.payload },
      }
    case actionTypes.USER_UPDATE:
      return {
        ...state,
        error: null,
        user: { ...state.user, ...action.payload },
      }
    case actionTypes.ERROR_UPDATE:
      return {
        ...state,
        error: action.payload.error,
      }
    default:
      return initialState
  }
}
