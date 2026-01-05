import { useSelector } from 'react-redux'

import { MessageNotificationState } from './state'

export const useMessageNotifications = () => useSelector((state) => MessageNotificationState.getMessages(state))
