import { useNotification } from './useNotification'

export const useNotifyInfo = () => {
  return useNotification({ severity: 'info' })
}
