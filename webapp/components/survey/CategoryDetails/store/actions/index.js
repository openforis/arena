import { useInit } from './useInit'
import { useUpdateCategoryProp } from './useUpdateCategoryProp'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),
  updateCategoryProp: useUpdateCategoryProp({ setState }),
})
