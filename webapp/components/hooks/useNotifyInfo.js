import { useNotification } from './useNotification'

export const useNotifyInfo = () => {
  const notify = useNotification({ severity: 'info' })
  return notify
}
