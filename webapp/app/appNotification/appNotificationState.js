import * as R from 'ramda'

export const stateKey = 'appNotification'

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

export const getMessageKey = R.propOr(null, keys.messageKey)
export const getMessageParams = R.propOr({}, keys.messageParams)
export const getSeverity = R.propOr(severity.info, keys.severity)
export const isVisible = R.propEq(keys.visible, true)

export const show = notification => ({
  ...notification,
  [keys.visible]: true
})

export const hide = ({})