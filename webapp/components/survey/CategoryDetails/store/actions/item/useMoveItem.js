import { useCallback } from 'react'

import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import { State } from '../../state'

const moveItemByOffset = ({ state, levelIndex, itemUuid, offset }) => {
  const items = State.getItemsArray({ levelIndex })(state)
  const itemIndexPrev = items.findIndex((itm) => CategoryItem.getUuid(itm) === itemUuid)
  const itemIndexNext = itemIndexPrev + offset
  const itemToReplace = items[itemIndexNext]
  if (!itemToReplace) {
    // final index out of bounds
    return state
  }
  let stateUpdated = state
  const itemToReplaceUuid = CategoryItem.getUuid(itemToReplace)
  // update current item index
  const indexPropKey = CategoryItem.keysProps.index
  stateUpdated = State.assocItemProp({ levelIndex, itemUuid, key: indexPropKey, value: itemIndexNext })(stateUpdated)
  // update item to replace index
  stateUpdated = State.assocItemProp({
    levelIndex,
    itemUuid: itemToReplaceUuid,
    key: indexPropKey,
    value: itemIndexPrev,
  })(stateUpdated)

  return stateUpdated
}

export const useMoveItem = ({ setState }) => {
  return useCallback(
    async ({ level, item, offset }) => {
      const itemUuid = CategoryItem.getUuid(item)
      const levelIndex = CategoryLevel.getIndex(level)
      setState((statePrev) => moveItemByOffset({ state: statePrev, levelIndex, itemUuid, offset }))
    },
    [setState]
  )
}
