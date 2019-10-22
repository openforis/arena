import * as NotificationState from './appNotificationState'
import { cancelDebouncedAction, debounceAction } from '../../utils/reduxUtils'

export const appNotificationShow = 'app/notification/show'
export const appNotificationHide = 'app/notification/hide'

export const showNotification = (messageKey, messageParams, severity) => dispatch => {
  dispatch({
    type: appNotificationShow,
    notification: {
      [NotificationState.keysNotification.messageKey]: messageKey,
      [NotificationState.keysNotification.messageParams]: messageParams,
      [NotificationState.keysNotification.severity]: severity,
    }
  })

  dispatch(debounceAction({ type: appNotificationHide }, appNotificationHide, 10000))
}

export const hideNotification = () => dispatch => {
  dispatch(cancelDebouncedAction(appNotificationHide))
  dispatch({ type: appNotificationHide })
}
