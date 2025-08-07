import { cancelDebouncedAction, debounceAction } from '@webapp/utils/reduxUtils'

import * as NotificationState from './state'

export const NOTIFICATION_SHOW = 'ui/notification/show'
export const NOTIFICATION_HIDE = 'ui/notification/hide'

export const showNotification =
  ({ key, params, severity, autoHide = true, timeout = 10000 }) =>
  (dispatch) => {
    const notification = NotificationState.newNotification({ key, params, severity })
    dispatch({ type: NOTIFICATION_SHOW, notification })
    if (autoHide && timeout > 0) {
      dispatch(debounceAction({ type: NOTIFICATION_HIDE }, NOTIFICATION_HIDE, timeout))
    }
  }

export const notifyInfo = ({ key, params, autoHide = true, timeout = 10000 }) =>
  showNotification({ key, params, autoHide, timeout, severity: NotificationState.severityType.info })

export const notifyWarning = ({ key, params, autoHide = true, timeout = 10000 }) =>
  showNotification({ key, params, autoHide, timeout, severity: NotificationState.severityType.warning })

export const notifyError = ({ key, params, autoHide = true, timeout = 10000 }) =>
  showNotification({ key, params, autoHide, timeout, severity: NotificationState.severityType.error })

export const hideNotification = () => (dispatch) => {
  cancelDebouncedAction(NOTIFICATION_HIDE)
  dispatch({ type: NOTIFICATION_HIDE })
}
