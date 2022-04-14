import { useNotification } from './useNotification'

export const useNotifyError = () => {
  const notify = useNotification({ severity: 'error' })
  return notify
}
