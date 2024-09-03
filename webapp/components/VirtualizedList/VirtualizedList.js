import './VirtualizedList.scss'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { debounce } from '@core/functionsDefer'
import { uuidv4 } from '@core/uuid'

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
    virtualizationThreshold,
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

  const virtualizationEnabled = rowCount > virtualizationThreshold

  const renderItem = ({ index, forceRendering, scrolling }) => {
    const oldItemInfo = itemsInfoByIndex[index]

    if (!forceRendering && oldItemInfo && !oldItemInfo.placeholder) {
      // use previous rendered item
      const { indexInList, placeholder } = oldItemInfo
      return {
        item: items[indexInList],
        placeholder,
      }
    }
    if (scrolling && showScrollingPlaceholders) {
      // scrolling and item not rendered yet: render placeholder
      return {
        item: placeholderRenderer({ index }),
        placeholder: true,
      }
    }
    // render new item
    return {
      item: rowRenderer({ index }),
      placeholder: false,
    }
  }

  const renderItems = useCallback(
    ({ scrolling = false, forceRendering = false } = {}) => {
      const scrollTop = scrollTopRef.current
      const startIndex = virtualizationEnabled
        ? Math.max(0, Math.floor(scrollTop / rowHeight) - overscanRowCount) // render items before the visible ones
        : 0
      const endIndex = virtualizationEnabled
        ? Math.min(
            rowCount - 1, // don't render past the end of the list
            Math.floor((scrollTop + externalContainerRef.current.offsetHeight) / rowHeight) + overscanRowCount // render 10 items after the visible ones
          )
        : rowCount - 1

      const newItems = []
      const newItemsInfoByIndex = []

      for (let index = startIndex; index <= endIndex; index++) {
        const { placeholder, item } = renderItem({ index, forceRendering, scrolling })

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
      if (!virtualizationEnabled) return // do not render items

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
  virtualizationThreshold: PropTypes.number, // threshold to consider before virtualizing the rendering
}

VirtualizedList.defaultProps = {
  className: null,
  overscanRowCount: 10,
  placeholderRenderer: () => (
    <div key={uuidv4()} className="item-placeholder">
      ...
    </div>
  ),
  showScrollingPlaceholders: true,
  virtualizationThreshold: 300,
}
