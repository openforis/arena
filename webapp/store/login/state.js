import * as A from '@core/arena'

export const stateKey = 'login'

const keys = {
  email: 'email',
  error: 'error',
  viewState: 'viewState',
  // 2FA step of a sign-in started with an external login provider
  externalLogin: 'externalLogin',
}

export const ViewState = {
  askUsernameAndPassword: 'askUsernameAndPassword',
  ask2FAToken: 'ask2FAToken',
  ask2FABackupCode: 'ask2FABackupCode',
}

const viewStates2FA = new Set([ViewState.ask2FAToken, ViewState.ask2FABackupCode])

const getStateProp = (key, defaultValue = null) => A.pathOr(defaultValue, [stateKey, key])

export const getError = getStateProp(keys.error)
export const assocError = A.assoc(keys.error)

export const getViewState = getStateProp(keys.viewState, ViewState.askUsernameAndPassword)
export const is2FAViewState = (state) => viewStates2FA.has(getViewState(state))
export const assocViewState = A.assoc(keys.viewState)

export const isExternalLogin = getStateProp(keys.externalLogin, false)
export const assocExternalLogin = A.assoc(keys.externalLogin)

export const getEmail = getStateProp(keys.email, '')
export const assocEmail = (email) => A.pipe(A.assoc(keys.email, email), assocError(null))
