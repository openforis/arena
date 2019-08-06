import * as R from 'ramda'

export const stateKey = 'login'

const keys = {
  requiredUserAction: 'requiredUserAction',
  error: 'error',
}

export const userActions = {
  login: 'login',
  setNewPassword: 'setNewPassword',
}

const getState = R.prop(stateKey)

export const setRequiredUserAction = action => R.assoc(keys.requiredUserAction, action)

export const assocError = message => R.assoc(keys.error, message)

export const getError = R.pipe(
  getState,
  R.prop(keys.error)
)

export const getRequiredUserAction = R.pipe(
  getState,
  R.prop(keys.requiredUserAction)
)