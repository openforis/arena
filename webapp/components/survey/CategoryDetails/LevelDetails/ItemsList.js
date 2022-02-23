import React, { useRef, useState } from 'react'

import * as CategoryItem from '@core/survey/categoryItem'

import ItemDetails from './ItemDetails'

const VirtualizedList = (props) => {
  const { className, numItems, itemHeight, renderItem } = props

  const externalContainerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)

  const innerHeight = numItems * itemHeight
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    numItems - 1, // don't render past the end of the list
    Math.floor((scrollTop + externalContainerRef.current?.offsetHeight) / itemHeight)
  )

  const items = []
  for (let i = startIndex; i <= endIndex; i++) {
    items.push(
      renderItem({
        index: i,
        style: {
          position: 'absolute',
          top: `${i * itemHeight}px`,
          width: '100%',
        },
      })
    )
  }

  return (
    <div
      ref={externalContainerRef}
      className={className}
      style={{ overflowY: 'scroll' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div className="virtualized-list__inner-container" style={{ position: 'relative', height: `${innerHeight}px` }}>
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
      renderItem={({ index, style }) => {
        const item = items[index]
        return (
          <ItemDetails
            key={CategoryItem.getUuid(item)}
            level={level}
            index={index}
            item={item}
            style={style}
            state={state}
            setState={setState}
          />
        )
      }}
    />
  )
}
