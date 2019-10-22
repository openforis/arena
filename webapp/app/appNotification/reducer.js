import { exportReducer } from '../../utils/reduxUtils'

import {
  appNotificationShow,
  appNotificationHide,
} from './actions'

import * as AppState from '../appState'

const actionHandlers = {
  [appNotificationShow]: (state, { notification }) => AppState.showNotification(notification)(state),

  [appNotificationHide]: AppState.hideNotification,
}

export default exportReducer(actionHandlers)
