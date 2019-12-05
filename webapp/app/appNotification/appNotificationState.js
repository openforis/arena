import * as R from 'ramda'

export const stateKey = 'appNotification'

const getState = R.propOr({}, stateKey)

const keys = {
  messageKey: 'messageKey',
  messageParams: 'messageParams',
  severity: 'severity',
  visible: 'visible',
}

export const severity = {
  info: 'info',
  warning: 'warning',
  error: 'error',
}

export const newNotification = (key, params, severity) => ({
  [keys.messageKey]: key,
  [keys.messageParams]: params,
  [keys.severity]: severity,
})

export const getMessageKey = R.pipe(getState, R.propOr(null, keys.messageKey))
export const getMessageParams = R.pipe(getState, R.propOr({}, keys.messageParams))
export const getSeverity = R.pipe(getState, R.propOr(severity.info, keys.severity))
export const isVisible = R.pipe(getState, R.propEq(keys.visible, true))

export const show = notification => ({
  ...notification,
  [keys.visible]: true,
})

export const hide = () => ({})
