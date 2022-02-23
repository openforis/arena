import './VirtualizedList.scss'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { debounce } from '@core/functionsDefer'

export const VirtualizedList = (props) => {
  const { className, id, numItems, itemHeight, renderItem } = props

  const externalContainerRef = useRef(null)
  const scrollTopRef = useRef(0)
  const [state, setState] = useState({ items: [], innerPaddingTop: 0 })
  const { items, innerPaddingTop } = state

  const innerHeight = numItems * itemHeight

  const renderItems = useCallback(() => {
    const scrollTop = scrollTopRef.current
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 10) // render 10 items before the visible ones
    const endIndex = Math.min(
      numItems - 1, // don't render past the end of the list
      Math.floor((scrollTop + externalContainerRef.current.offsetHeight) / itemHeight) + 10 // render 10 items after the visible ones
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
  }, [numItems, itemHeight, renderItem, scrollTopRef, externalContainerRef])

  useEffect(() => {
    renderItems()
  }, [numItems, itemHeight, renderItem, externalContainerRef])

  const onScroll = useCallback(
    (e) => {
      scrollTopRef.current = e.currentTarget.scrollTop
      debounce(renderItems, `virtualized_list_${id}_scroll`, 200)()
    },
    [id, renderItems, scrollTopRef]
  )

  return (
    <div ref={externalContainerRef} className={classNames('virtualized-list', className)} onScroll={onScroll}>
      <div
        className="virtualized-list__inner-container"
        style={{ position: 'relative', height: `${innerHeight}px`, paddingTop: `${innerPaddingTop}px` }}
      >
        {items}
      </div>
    </div>
  )
}

VirtualizedList.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
  numItems: PropTypes.number.isRequired,
  itemHeight: PropTypes.number.isRequired,
  renderItem: PropTypes.func.isRequired,
}

VirtualizedList.defaultProps = {
  className: null,
}
