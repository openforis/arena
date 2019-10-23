import * as R from 'ramda'

import * as AppState from '../appState'

export const stateKey = 'notification'

const keys = {
  notification: 'notification',
}

export const keysNotification = {
  messageKey: 'messageKey',
  messageParams: 'messageParams',
  visible: 'visible',
  severity: 'severity',
}

export const notificationSeverity = {
  info: 'info',
  warning: 'warning',
  error: 'error',
}
  
export const getNotificationMessageKey = R.pipe(AppState.getState, R.pathOr(null, [keys.notification, keysNotification.messageKey]))
export const getNotificationMessageParams = R.pipe(AppState.getState, R.pathOr({}, [keys.notification, keysNotification.messageParams]))
export const getNotificationSeverity = R.pipe(AppState.getState, R.pathOr(notificationSeverity.info, [keys.notification, keysNotification.severity]))
export const isNotificationVisible = R.pipe(AppState.getState, R.pathEq([keys.notification, keysNotification.visible], true))

export const showNotification = notification => R.pipe(
  R.assoc(keys.notification, notification),
  R.assocPath([keys.notification, keysNotification.visible], true)
)

export const hideNotification = R.assocPath([keys.notification, keysNotification.visible], false)