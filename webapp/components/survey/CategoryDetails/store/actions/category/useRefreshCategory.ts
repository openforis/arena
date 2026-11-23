import { useCallback } from 'react'

import * as A from '@core/arena'
import { SurveyActions } from '@webapp/store/survey'

import { State } from '../../state'
import { useFetchLevelItems } from '../item/useFetchLevelItems'
import { useAppDispatch } from '@webapp/store'

export const useRefreshCategory = ({ setState }) => {
  const dispatch = useAppDispatch()
  const fetchLevelItems = useFetchLevelItems({ setState })

  return useCallback(
    ({ category }) => {
      dispatch(SurveyActions.metaUpdated())

      setState((statePrev) => {
        const stateUpdated = A.pipe(
          State.assocCategory({ category }),
          State.dissocImportSummary,
          State.dissocItemsActive
        )(statePrev)

        // Fetch first level items
        fetchLevelItems({ state: stateUpdated })

        return stateUpdated
      })
    },
    [dispatch, fetchLevelItems, setState]
  )
}
