import * as R from 'ramda'

import * as UiState from '../state'

export const stateKey = 'notification'

const getState = R.pipe(UiState.getState, R.propOr({}, stateKey))

const keys = {
  messageKey: 'messageKey',
  messageParams: 'messageParams',
  severity: 'severity',
  visible: 'visible',
}

export const severityType = {
  info: 'info',
  warning: 'warning',
  error: 'error',
}

// ====== CREATE
export const newNotification = ({ key, params, severity }) => ({
  [keys.messageKey]: key,
  [keys.messageParams]: params,
  [keys.severity]: severity,
})

// ====== READ
export const getMessageKey = R.pipe(getState, R.propOr(null, keys.messageKey))
export const getMessageParams = R.pipe(getState, R.propOr({}, keys.messageParams))
export const getSeverity = R.pipe(getState, R.propOr(severityType.info, keys.severity))
export const isVisible = R.pipe(getState, R.propEq(keys.visible, true))

export const show = (notification) => ({
  ...notification,
  [keys.visible]: true,
})

// ====== UPDATE
export const hide = () => ({})
