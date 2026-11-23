import * as A from '@core/arena'

import * as UiState from '../state'

export const stateKey = 'notification'

const getState = A.pipe(UiState.getState, A.propOr({}, stateKey))

const keys = {
  messageKey: 'messageKey',
  messageParams: 'messageParams',
  messageText: 'messageText',
  severity: 'severity',
  visible: 'visible',
}

export const severityType = {
  info: 'info',
  warning: 'warning',
  error: 'error',
}

// ====== CREATE
// either an i18n `key` (+ optional `params`) or an already resolved `text` can be specified;
// `text` takes precedence and is displayed as is, without going through i18n
export const newNotification = ({ key, params, text, severity }) => ({
  [keys.messageKey]: key,
  [keys.messageParams]: params,
  [keys.messageText]: text,
  [keys.severity]: severity,
})

// ====== READ
export const getMessageKey = A.pipe(getState, A.propOr(null, keys.messageKey))
export const getMessageParams = A.pipe(getState, A.propOr({}, keys.messageParams))
export const getMessageText = A.pipe(getState, A.propOr(null, keys.messageText))
export const getSeverity = A.pipe(getState, A.propOr(severityType.info, keys.severity))
export const isVisible = A.pipe(getState, A.propEq(keys.visible, true))

export const show = (notification) => ({
  ...notification,
  [keys.visible]: true,
})

// ====== UPDATE
export const hide = () => ({})
