import { exportReducer } from '../../utils/reduxUtils'

import {
  appNotificationShow,
  appNotificationHide,
} from './actions'

import * as NotificationState from './appNotificationState'

const actionHandlers = {
  [appNotificationShow]: (state, { notification }) => NotificationState.showNotification(notification)(state),

  [appNotificationHide]: NotificationState.hideNotification,
}

export default exportReducer(actionHandlers)
