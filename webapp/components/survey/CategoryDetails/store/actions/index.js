import { useInit } from './useInit'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),
})
