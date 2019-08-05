import * as R from 'ramda'

export const stateKey = 'login'

const keys = {
  passwordResetUser: 'passwordResetUser',
  error: 'error',
}

const getState = R.prop(stateKey)

export const assocPasswordResetUser = user => R.assoc(keys.passwordResetUser, user)

export const assocError = message => R.assoc(keys.error, message)

export const getError = R.pipe(
  getState,
  R.prop(keys.error)
)

export const getPasswordResetUser = R.pipe(
  getState,
  R.prop(keys.passwordResetUser)
)