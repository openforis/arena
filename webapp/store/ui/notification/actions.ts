import type { AppDispatch } from '@webapp/store/store'
import { cancelDebouncedAction, debounceAction } from '@webapp/utils/reduxUtils'

import * as NotificationState from './state'

export const NOTIFICATION_SHOW = 'ui/notification/show'
export const NOTIFICATION_HIDE = 'ui/notification/hide'

export type NotificationParams = {
  // i18n key of the message (or keys, the first one found is used)
  key?: string | string[]
  // parameters of the i18n message
  params?: Record<string, unknown>
  // text to show, instead of the i18n message
  text?: string
  // true to hide the notification after the timeout
  autoHide?: boolean
  // timeout (in milliseconds)
  timeout?: number
}

export const showNotification =
  ({ key, params, text, severity, autoHide = true, timeout = 10000 }: NotificationParams & { severity: string }) =>
  (dispatch: AppDispatch): void => {
    const notification = NotificationState.newNotification({ key, params, text, severity })
    dispatch({ type: NOTIFICATION_SHOW, notification })
    if (autoHide && timeout > 0) {
      dispatch(debounceAction({ type: NOTIFICATION_HIDE }, NOTIFICATION_HIDE, timeout))
    }
  }

// shows an info notification
export const notifyInfo = ({ key, params, text, autoHide = true, timeout = 10000 }: NotificationParams) =>
  showNotification({ key, params, text, autoHide, timeout, severity: NotificationState.severityType.info })

// shows a warning notification
export const notifyWarning = ({ key, params, text, autoHide = true, timeout = 10000 }: NotificationParams) =>
  showNotification({ key, params, text, autoHide, timeout, severity: NotificationState.severityType.warning })

// shows an error notification
export const notifyError = ({ key, params, text, autoHide = true, timeout = 10000 }: NotificationParams) =>
  showNotification({ key, params, text, autoHide, timeout, severity: NotificationState.severityType.error })

export const hideNotification = () => (dispatch: AppDispatch) => {
  cancelDebouncedAction(NOTIFICATION_HIDE)
  dispatch({ type: NOTIFICATION_HIDE })
}
