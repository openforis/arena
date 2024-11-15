import { useDispatch } from 'react-redux'

import { NotificationActions } from '@webapp/store/ui'
import { useCallback } from 'react'

const useNotification = ({ severity }) => {
  const dispatch = useDispatch()

  return useCallback(
    ({ key, params = {}, timeout = 10000 }) =>
      dispatch(NotificationActions.showNotification({ severity, key, params, timeout })),
    [dispatch, severity]
  )
}

export const useNotifyInfo = () => useNotification({ severity: 'info' })

export const useNotifyWarning = () => useNotification({ severity: 'warning' })

export const useNotifyError = () => useNotification({ severity: 'error' })
