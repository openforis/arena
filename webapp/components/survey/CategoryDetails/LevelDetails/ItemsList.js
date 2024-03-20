import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { VirtualizedList } from '@webapp/components/VirtualizedList'
import { useI18n } from '@webapp/store/system'

import ItemDetails from './ItemDetails'

export const ItemsList = (props) => {
  const { items, level, state, setState } = props

  const i18n = useI18n()

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
