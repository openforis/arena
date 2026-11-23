import { useCallback } from 'react'

import { useFetchLevelItems } from './useFetchLevelItems'

import { State } from '../../state'

export const useSetItemActive = ({ setState }) => {
  const fetchLevelItems = useFetchLevelItems({ setState })

  return useCallback(async ({ levelIndex, itemUuid }) => {
    let stateUpdated = null
    await setState((statePrev) => {
      stateUpdated = State.assocItemActive({ levelIndex, itemUuid })(statePrev)
      return stateUpdated
    })

    // Fetch next level items
    await fetchLevelItems({ state: stateUpdated })
  }, [])
}
