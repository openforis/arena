import * as NotificationState from './appNotificationState'
import { cancelDebouncedAction, debounceAction } from '../../utils/reduxUtils'

export const appNotificationShow = 'app/notification/show'
export const appNotificationHide = 'app/notification/hide'

export const showNotification = (
  key,
  params,
  severity = NotificationState.severity.info,
  timeout = 10000,
) => dispatch => {
  dispatch({
    type: appNotificationShow,
    notification: NotificationState.newNotification(key, params, severity),
  })

  dispatch(debounceAction({ type: appNotificationHide }, appNotificationHide, timeout))
}

export const hideNotification = () => dispatch => {
  dispatch(cancelDebouncedAction(appNotificationHide))
  dispatch({ type: appNotificationHide })
}
