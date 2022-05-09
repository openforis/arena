import { useDispatch } from 'react-redux'

import { NotificationActions } from '@webapp/store/ui'

const useNotification = ({ severity }) => {
  const dispatch = useDispatch()

  return ({ key, params = {}, timeout = 10000 }) =>
    dispatch(NotificationActions.showNotification({ severity, key, params, timeout }))
}

export const useNotifyInfo = () => useNotification({ severity: 'info' })

export const useNotifyWarning = () => useNotification({ severity: 'warning' })

export const useNotifyError = () => useNotification({ severity: 'error' })
