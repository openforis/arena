import * as R from 'ramda'

export const stateKey = 'login'

const keys = {
  email: 'email',
  userAction: 'userAction',
  error: 'error',
}

export const userActions = {
  login: 'login',
  setNewPassword: 'setNewPassword',
}

const getStateProp = (key, defaultValue = null) => R.pathOr(defaultValue, [stateKey, key])

export const getEmail = getStateProp(keys.email, '')

export const assocEmail = R.assoc(keys.email)

export const getUserAction = getStateProp(keys.userAction, userActions.login)

export const assocUserAction = R.assoc(keys.userAction)

export const getError = getStateProp(keys.error)

export const assocError = R.assoc(keys.error)
