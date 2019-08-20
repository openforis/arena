import * as R from 'ramda'

export const stateKey = 'login'

const keys = {
  userAction: 'userAction',
  error: 'error',
}

export const userActions = {
  login: 'login',
  setNewPassword: 'setNewPassword',
  forgotPassword: 'forgotPassword',
  resetPassword: 'resetPassword',
}

const getStateProp = (key, defaultValue = null) => R.pathOr(defaultValue, [stateKey, key])

export const getUserAction = getStateProp(keys.userAction, userActions.login)

export const assocUserAction = R.assoc(keys.userAction)

export const getError = getStateProp(keys.error)

export const assocError = R.assoc(keys.error)
