import { useSelector } from 'react-redux'

import * as NotificationState from './state'

export const useNotification = () => {
  const messageKey = useSelector(NotificationState.getMessageKey)
  const messageParams = useSelector(NotificationState.getMessageParams)
  const severity = useSelector(NotificationState.getSeverity)
  const visible = useSelector(NotificationState.isVisible)

  return { messageParams, messageKey, severity, visible }
}
