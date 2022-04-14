import { useDispatch } from 'react-redux'

import { NotificationActions } from '@webapp/store/ui'

export const useNotification = ({ severity }) => {
  const dispatch = useDispatch()

  return ({ key, params = {}, timeout = 10000 }) =>
    dispatch(NotificationActions.showNotification({ severity, key, params, timeout }))
}
