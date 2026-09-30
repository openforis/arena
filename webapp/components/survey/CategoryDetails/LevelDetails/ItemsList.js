import React, { useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { VirtualizedList } from '@webapp/components/VirtualizedList'
import { useI18n } from '@webapp/store/system'

import { State } from '../store'
import ItemDetails from './ItemDetails'

export const ItemsList = (props) => {
  const { items, level, state, setState } = props

  const i18n = useI18n()

  const listRef = useRef(null)
  const prevItemsCountRef = useRef(items.length)

  const levelIndex = CategoryLevel.getIndex(level)
  const itemActive = State.getItemActive({ levelIndex })(state)
  const lastItem = items[items.length - 1]
  const lastItemActive = !!itemActive && !!lastItem && CategoryItem.isEqual(itemActive)(lastItem)

  // new item added (appended as last and active): scroll to it so its editor is visible
  useEffect(() => {
    const itemAdded = items.length > prevItemsCountRef.current
    prevItemsCountRef.current = items.length
    if (itemAdded && lastItemActive) {
      listRef.current?.scrollToIndex(items.length - 1)
    }
  }, [items.length, lastItemActive])

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

  if (items.length === 0) {
    return <div className="category__level-items-message">{i18n.t('categoryEdit.level.noItemsDefined')}</div>
  }

  return (
    <VirtualizedList
      ref={listRef}
      id={`virtualized_list_level_${CategoryLevel.getUuid(level)}`}
      className="category__level-items"
      overscanRowCount={20}
      rowCount={items.length}
      rowHeight={34}
      rowRenderer={rowRenderer}
    />
  )
}

ItemsList.propTypes = {
  items: PropTypes.array.isRequired,
  level: PropTypes.object.isRequired,
  state: PropTypes.object.isRequired,
  setState: PropTypes.func.isRequired,
}
