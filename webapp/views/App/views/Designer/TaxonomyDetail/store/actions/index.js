import { useUpload } from './useUpload'

export const useActions = ({ setState }) => ({
  upload: useUpload({ setState }),
})
