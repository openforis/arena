import { cancelDebouncedAction, debounceAction } from '../../utils/reduxUtils'
import * as NotificationState from './appNotificationState'

export const appNotificationShow = 'app/notification/show'
export const appNotificationHide = 'app/notification/hide'

export const showNotification = (key, params, severity) => dispatch => {
  dispatch({
    type: appNotificationShow,
    notification: NotificationState.newNotification(key, params, severity),
  })

  dispatch(
    debounceAction({ type: appNotificationHide }, appNotificationHide, 10000),
  )
}

export const hideNotification = () => dispatch => {
  dispatch(cancelDebouncedAction(appNotificationHide))
  dispatch({ type: appNotificationHide })
}
