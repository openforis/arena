import React, { useCallback } from 'react'

import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { VirtualizedList } from '@webapp/components/VirtualizedList'

import ItemDetails from './ItemDetails'

export const ItemsList = (props) => {
  const { items, level, state, setState } = props

  const rowRenderer = useCallback(
    ({ index }) => {
      const item = items[index]
      return (
        <ItemDetails
          key={CategoryItem.getUuid(item)}
          level={level}
          index={index}
          item={item}
          state={state}
          setState={setState}
        />
      )
    },
    [items, level, state, setState]
  )

  return (
    <VirtualizedList
      id={`virtualized_list_level_${CategoryLevel.getUuid(level)}`}
      className="category__level-items"
      overscanRowCount={20}
      rowCount={items.length}
      rowHeight={34}
      rowRenderer={rowRenderer}
    />
  )
}
