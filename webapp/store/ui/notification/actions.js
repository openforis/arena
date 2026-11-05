import { cancelDebouncedAction, debounceAction } from '@webapp/utils/reduxUtils'

import * as NotificationState from './state'

export const NOTIFICATION_SHOW = 'ui/notification/show'
export const NOTIFICATION_HIDE = 'ui/notification/hide'

export const showNotification =
  ({ key, params, text, severity, autoHide = true, timeout = 10000 }) =>
  (dispatch) => {
    const notification = NotificationState.newNotification({ key, params, text, severity })
    dispatch({ type: NOTIFICATION_SHOW, notification })
    if (autoHide && timeout > 0) {
      dispatch(debounceAction({ type: NOTIFICATION_HIDE }, NOTIFICATION_HIDE, timeout))
    }
  }

/**
 * @typedef {object} NotificationParams
 * @property {string} [key] - The i18n key of the message.
 * @property {object} [params] - The parameters of the i18n message.
 * @property {string} [text] - The text to show, instead of the i18n message.
 * @property {boolean} [autoHide] - True to hide the notification after the timeout.
 * @property {number} [timeout] - The timeout (in milliseconds).
 */

/**
 * Shows an info notification.
 * @param {NotificationParams} notification - The notification.
 * @returns {(dispatch: Function) => void} - The thunk.
 */
export const notifyInfo = ({ key, params, text, autoHide = true, timeout = 10000 }) =>
  showNotification({ key, params, text, autoHide, timeout, severity: NotificationState.severityType.info })

/**
 * Shows a warning notification.
 * @param {NotificationParams} notification - The notification.
 * @returns {(dispatch: Function) => void} - The thunk.
 */
export const notifyWarning = ({ key, params, text, autoHide = true, timeout = 10000 }) =>
  showNotification({ key, params, text, autoHide, timeout, severity: NotificationState.severityType.warning })

/**
 * Shows an error notification.
 * @param {NotificationParams} notification - The notification.
 * @returns {(dispatch: Function) => void} - The thunk.
 */
export const notifyError = ({ key, params, text, autoHide = true, timeout = 10000 }) =>
  showNotification({ key, params, text, autoHide, timeout, severity: NotificationState.severityType.error })

export const hideNotification = () => (dispatch) => {
  cancelDebouncedAction(NOTIFICATION_HIDE)
  dispatch({ type: NOTIFICATION_HIDE })
}
