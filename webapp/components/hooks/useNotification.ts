import { useCallback } from 'react'

import { useAppDispatch } from '@webapp/store/hooks'
import { NotificationActions } from '@webapp/store/ui'

const useNotification = ({ severity }) => {
  const dispatch = useAppDispatch()

  return useCallback(
    ({ key, params = {}, timeout = 10000 }) =>
      dispatch(NotificationActions.showNotification({ severity, key, params, timeout })),
    [dispatch, severity]
  )
}

export const useNotifyInfo = () => useNotification({ severity: 'info' })

export const useNotifyWarning = () => useNotification({ severity: 'warning' })

export const useNotifyError = () => useNotification({ severity: 'error' })
