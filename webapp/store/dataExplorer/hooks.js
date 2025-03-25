import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { DataExplorerActions } from './reducer'

const useSetQuery = () => {
  const dispatch = useDispatch()

  return useCallback(
    (queryUpdated) => {
      dispatch(DataExplorerActions.setQuery(queryUpdated))
    },
    [dispatch]
  )
}

export const DataExplorerHooks = {
  useSetQuery,
}
