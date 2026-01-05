import { useSelector } from 'react-redux'

import { MessageNotificationState } from './state'

export const useMessages = () => useSelector((state) => MessageNotificationState.getMessages(state))
