import { useInit } from './useInit'
import { useUpload } from './useUpload'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),
  upload: useUpload({ setState }),
})
