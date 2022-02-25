import './VirtualizedList.scss'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { debounce } from '@core/functionsDefer'

import { LoadingBar } from '@webapp/components'

export const VirtualizedList = (props) => {
  const {
    className,
    id,
    overscanRowCount,
    rowCount,
    rowHeight,
    rowRenderer,
    showScrollingPlaceholders,
    placeholderRenderer,
  } = props

  const externalContainerRef = useRef(null)
  const scrollTopRef = useRef(0)
  const [state, setState] = useState({
    items: [], // list of items to show (they can be rendered items or placeholders)
    innerPaddingTop: 0, // padding of internal list from top (used to show only rendered items in the inner container)
    itemsInfoByIndex: [], // keeps track of the rendered items or placeholder by the index in the data
  })
  const { itemsInfoByIndex, items, innerPaddingTop } = state

  const loading = rowCount > 0 && items.length === 0

  const innerHeight = rowCount * rowHeight

  const renderItems = useCallback(
    ({ scrolling = false, forceRendering = false } = {}) => {
      const scrollTop = scrollTopRef.current
      const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscanRowCount) // render items before the visible ones
      const endIndex = Math.min(
        rowCount - 1, // don't render past the end of the list
        Math.floor((scrollTop + externalContainerRef.current.offsetHeight) / rowHeight) + overscanRowCount // render 10 items after the visible ones
      )
      const newItems = []
      const newItemsInfoByIndex = []

      for (let index = startIndex; index <= endIndex; index++) {
        const oldItemInfo = itemsInfoByIndex[index]
        let item
        let placeholder = false
        if (!forceRendering && oldItemInfo && !oldItemInfo.placeholder) {
          // use previous rendered item
          item = items[oldItemInfo.indexInList]
        } else if (scrolling && showScrollingPlaceholders) {
          // scrolling and item not rendered yet: render placeholder
          item = placeholderRenderer({ index })
          placeholder = true
        } else {
          // render new item
          item = rowRenderer({ index })
        }
        newItemsInfoByIndex[index] = {
          indexInList: newItems.length,
          placeholder,
        }
        newItems.push(item)
      }
      setState((statePrev) => ({
        ...statePrev,
        itemsInfoByIndex: newItemsInfoByIndex,
        items: newItems,
        innerPaddingTop: startIndex * rowHeight,
      }))
    },
    [externalContainerRef, itemsInfoByIndex, overscanRowCount, rowCount, rowHeight, rowRenderer, scrollTopRef]
  )

  useEffect(() => {
    renderItems({ forceRendering: true })
  }, [externalContainerRef, overscanRowCount, rowCount, rowHeight, rowRenderer])

  const onScroll = useCallback(
    (e) => {
      scrollTopRef.current = e.currentTarget.scrollTop
      if (showScrollingPlaceholders) {
        // render placeholders
        renderItems({ scrolling: true })
      }
      // debounce items rendering to avoid rendering too many times the items
      debounce(renderItems, `virtualized_list_${id}_scroll`, 200)()
    },
    [id, renderItems, scrollTopRef]
  )

  return (
    <div ref={externalContainerRef} className={classNames('virtualized-list', className)} onScroll={onScroll}>
      {loading && <LoadingBar />}
      {!loading && (
        <div
          className="virtualized-list__inner-container"
          style={{ position: 'relative', height: `${innerHeight}px`, paddingTop: `${innerPaddingTop}px` }}
        >
          {items}
        </div>
      )}
    </div>
  )
}

VirtualizedList.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
  overscanRowCount: PropTypes.number,
  placeholderRenderer: PropTypes.func,
  rowCount: PropTypes.number.isRequired,
  rowHeight: PropTypes.number.isRequired,
  rowRenderer: PropTypes.func.isRequired,
  showScrollingPlaceholders: PropTypes.bool,
}

VirtualizedList.defaultProps = {
  className: null,
  overscanRowCount: 10,
  placeholderRenderer: () => <div className="item-placeholder">...</div>,
  showScrollingPlaceholders: true,
}
