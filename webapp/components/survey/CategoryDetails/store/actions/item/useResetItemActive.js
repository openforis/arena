import { useCallback } from 'react'

import * as CategoryItem from '@core/survey/categoryItem'

import { State } from '../../state'

// if itemUuid is specified, the active item is reset only if it's still that item
export const useResetItemActive = ({ setState }) =>
  useCallback(
    ({ levelIndex, itemUuid = null }) =>
      setState((statePrev) => {
        if (itemUuid) {
          const itemActive = State.getItemActive({ levelIndex })(statePrev)
          if (!itemActive || CategoryItem.getUuid(itemActive) !== itemUuid) return statePrev
        }
        return State.dissocItemActive({ levelIndex })(statePrev)
      }),
    []
  )
