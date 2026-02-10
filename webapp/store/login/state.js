import * as R from 'ramda'

export const stateKey = 'login'

const keys = {
  email: 'email',
  error: 'error',
  viewState: 'viewState',
}

export const ViewState = {
  askUsernameAndPassword: 'askUsernameAndPassword',
  ask2FAToken: 'ask2FAToken',
  ask2FABackupCode: 'ask2FABackupCode',
}

const viewStates2FA = new Set([ViewState.ask2FAToken, ViewState.ask2FABackupCode])

const getStateProp = (key, defaultValue = null) => R.pathOr(defaultValue, [stateKey, key])

export const getError = getStateProp(keys.error)
export const assocError = R.assoc(keys.error)

export const getViewState = getStateProp(keys.viewState, ViewState.askUsernameAndPassword)
export const is2FAViewState = (state) => viewStates2FA.has(getViewState(state))
export const assocViewState = R.assoc(keys.viewState)

export const getEmail = getStateProp(keys.email, '')
export const assocEmail = (email) => R.pipe(R.assoc(keys.email, email), assocError(null))
