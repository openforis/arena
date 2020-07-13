import { useInit } from './useInit'
import { useFetchLevelItems } from './useFetchLevelItems'
import { useDeleteLevel } from './useDeleteLevel'
import { useUpdateLevelProp } from './useUpdateLevelProp'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),
  fetchLevelItems: useFetchLevelItems({ setState }),
  deleteLevel: useDeleteLevel({ setState }),
  updateLevelProp: useUpdateLevelProp({ setState }),
})
