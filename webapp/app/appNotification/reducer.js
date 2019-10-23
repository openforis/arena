import { exportReducer } from '../../utils/reduxUtils'

import {
  appNotificationShow,
  appNotificationHide,
} from './actions'

import * as NotificationState from './appNotificationState'

const actionHandlers = {
  [appNotificationShow]: (state, { notification }) => NotificationState.show(notification),

  [appNotificationHide]: NotificationState.hide,
}

export default exportReducer(actionHandlers)
