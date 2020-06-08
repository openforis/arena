import { exportReducer } from '@webapp/utils/reduxUtils'

import * as NotificationActions from './actions'
import * as NotificationState from './state'

const actionHandlers = {
  [NotificationActions.appNotificationShow]: (state, { notification }) => NotificationState.show(notification),

  [NotificationActions.appNotificationHide]: NotificationState.hide,
}

export default exportReducer(actionHandlers)
