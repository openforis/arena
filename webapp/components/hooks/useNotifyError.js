import { useNotification } from './useNotification'

export const useNotifyError = () => {
  return useNotification({ severity: 'error' })
}
