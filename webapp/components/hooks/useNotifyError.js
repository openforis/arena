import { useNotification } from './useNotification'

export const useNotifyError = () => useNotification({ severity: 'error' })
