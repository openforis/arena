import { useCallback } from 'react'

import { State } from '../../state'

import { useFetchLevelItems } from './useFetchLevelItems'

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
