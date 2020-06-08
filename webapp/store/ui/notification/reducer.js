import { exportReducer } from '@webapp/utils/reduxUtils'

import * as NotificationActions from './actions'
import * as NotificationState from './state'

const actionHandlers = {
  [NotificationActions.NOTIFICATION_SHOW]: (state, { notification }) => NotificationState.show(notification),

  [NotificationActions.NOTIFICATION_HIDE]: NotificationState.hide,
}

export default exportReducer(actionHandlers)
