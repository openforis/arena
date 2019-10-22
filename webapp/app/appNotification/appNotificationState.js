import * as R from 'ramda'

import { getState } from '../appState'

export { getI18n } from '../appState'

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
  
export const getNotificationMessageKey = R.pipe(getState, R.pathOr(null, [keys.notification, keysNotification.messageKey]))
export const getNotificationMessageParams = R.pipe(getState, R.pathOr({}, [keys.notification, keysNotification.messageParams]))
export const getNotificationSeverity = R.pipe(getState, R.pathOr(notificationSeverity.info, [keys.notification, keysNotification.severity]))
export const isNotificationVisible = R.pipe(getState, R.pathEq([keys.notification, keysNotification.visible], true))

export const showNotification = notification => R.pipe(
  R.assoc(keys.notification, notification),
  R.assocPath([keys.notification, keysNotification.visible], true)
)

export const hideNotification = R.assocPath([keys.notification, keysNotification.visible], false)