import React, { useRef, useState } from 'react'

import * as CategoryItem from '@core/survey/categoryItem'

import { useOnUpdate } from '@webapp/components/hooks'

import ItemDetails from './ItemDetails'

const VirtualizedList = (props) => {
  const { className, numItems, itemHeight, renderItem } = props

  const externalContainerRef = useRef(null)
  const [state, setState] = useState({ items: [], innerPaddingTop: 0, scrollTop: 0 })
  const { items, innerPaddingTop, scrollTop } = state

  const innerHeight = numItems * itemHeight

  useOnUpdate(() => {
    const externalContainer = externalContainerRef.current
    if (!externalContainer) return

    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      numItems - 1, // don't render past the end of the list
      Math.floor((scrollTop + externalContainer.offsetHeight) / itemHeight)
    )
    const innerPaddingTop = startIndex * itemHeight

    const _items = []
    for (let i = startIndex; i <= endIndex; i++) {
      _items.push(
        renderItem({
          index: i,
        })
      )
    }
    setState((statePrev) => ({ ...statePrev, items: _items, innerPaddingTop }))
  }, [numItems, itemHeight, renderItem, scrollTop, externalContainerRef])

  return (
    <div
      ref={externalContainerRef}
      className={className}
      style={{ overflowY: 'scroll' }}
      onScroll={(e) => setState((statePrev) => ({ ...statePrev, scrollTop: e.currentTarget.scrollTop }))}
    >
      <div
        className="virtualized-list__inner-container"
        style={{ position: 'relative', height: `${innerHeight}px`, paddingTop: `${innerPaddingTop}px` }}
      >
        {items}
      </div>
    </div>
  )
}

export const ItemsList = (props) => {
  const { items, level, state, setState } = props

  return (
    <VirtualizedList
      className="category__level-items"
      numItems={items.length}
      itemHeight={34}
      renderItem={({ index }) => {
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
      }}
    />
  )
}
