import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import { SurveyActions } from '@webapp/store/survey'

import { State } from '../../state'
import { useFetchLevelItems } from '../item/useFetchLevelItems'

export const useRefreshCategory = ({ setState }) => {
  const dispatch = useDispatch()
  const fetchLevelItems = useFetchLevelItems({ setState })

  return useCallback(
    async ({ category }) => {
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
