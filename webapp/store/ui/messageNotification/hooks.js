import { useSelector } from 'react-redux'

import { MessageNotificationState } from './state'

export const useMessageNotifications = () => useSelector((state) => MessageNotificationState.getMessages(state))

export const useHasMessageNotifications = () =>
  useSelector((state) => MessageNotificationState.getMessages(state).length > 0)
