import { useCallback } from 'react'

import { useFetchLevelItems } from './useFetchLevelItems'

import { State } from '../../state'

export const useSetItemActive = ({ setState }) => {
  const fetchLevelItems = useFetchLevelItems({ setState })

  return useCallback(async ({ categoryUuid, levelIndex, itemUuid }) => {
    setState(State.assocItemActive({ levelIndex, itemUuid }))

    // Fetch next level items
    await fetchLevelItems({ categoryUuid, levelIndex: levelIndex + 1, parentUuid: itemUuid })
  }, [])
}
