import { useNotification } from './useNotification'

export const useNotifyWarning = () => {
  const notify = useNotification({ severity: 'warning' })
  return notify
}
