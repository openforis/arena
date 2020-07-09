import { useInit } from './useInit'
import { useUpload } from './useUpload'
import { useUpdate } from './useUpdate'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),
  upload: useUpload({ setState }),
  update: useUpdate({ setState }),
})
