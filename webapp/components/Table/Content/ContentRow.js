import React, { useCallback, useState } from 'react'
import classNames from 'classnames'

import { isEventFromInteractiveChild } from '@webapp/utils/domUtils'

const expandedPanelClassName = 'table__row-expanded-panel-wrapper'

// clicks on the controls in the row or in its expanded panel must not select or open the row
const isEventFromRowCells = (event) => {
  if (isEventFromInteractiveChild(event)) return false
  const expandedPanel = event.target.closest(`.${expandedPanelClassName}`)
  return !expandedPanel || !event.currentTarget.contains(expandedPanel)
}

export const ContentRow = (props) => {
  const {
    cellTestIdExtractor,
    expandableRows,
    gridTemplateColumns,
    index,
    initData,
    isRowActive,
    isRowExpandable,
    isRowOpenable,
    module,
    offset,
    onItemSelectToggle,
    onRowOpen,
    item,
    rowComponent,
    rowExpandedComponent,
    rowProps,
    selectable,
    selected,
  } = props

  const [rowExpanded, setRowExpanded] = useState(false)

  const active = isRowActive?.(item)
  const openable = Boolean(onRowOpen) && (isRowOpenable?.(item) ?? true)
  const clickable = selectable || openable
  const className = classNames('table__row', {
    hoverable: clickable,
    active,
    expanded: rowExpanded,
    selected,
  })

  const onRowExpandToggle = () => setRowExpanded((oldExpanded) => !oldExpanded)

  const itemPosition = index + offset + 1

  const toggleSelected = useCallback(() => onItemSelectToggle(item), [item, onItemSelectToggle])

  const open = useCallback(async () => {
    if (openable) await onRowOpen(item)
  }, [item, onRowOpen, openable])

  // selectable rows: click selects, double click opens; other rows: click opens
  const onClick = useCallback(
    async (event) => {
      // the second click of a double click is handled by onDoubleClick
      if (event.detail > 1 || !isEventFromRowCells(event)) return
      if (selectable) {
        toggleSelected()
      } else {
        await open()
      }
    },
    [open, selectable, toggleSelected]
  )

  const onDoubleClick = useCallback(
    async (event) => {
      if (selectable && isEventFromRowCells(event)) await open()
    },
    [open, selectable]
  )

  const onKeyDown = useCallback(
    async (event) => {
      // keys pressed in the elements inside the row must not activate it
      if (event.target !== event.currentTarget) return
      if (event.key === 'Enter') {
        event.preventDefault()
        await open()
      } else if (event.key === ' ') {
        event.preventDefault()
        if (selectable) {
          toggleSelected()
        } else {
          await open()
        }
      }
    },
    [open, selectable, toggleSelected]
  )

  return (
    <div // NOSONAR: role="button" with interactive children (buttons), a native <button> cannot wrap them
      data-testid={`${module}_${index}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onDoubleClick={clickable ? onDoubleClick : undefined}
      onKeyDown={clickable ? onKeyDown : undefined}
      className={className}
      style={{ gridTemplateColumns }}
    >
      {React.createElement(rowComponent, {
        ...rowProps,
        cellTestIdExtractor,
        initData,
        active,
        idx: index,
        offset,
        item,
        itemPosition,
        onRowExpandToggle,
        expandableRows,
        isRowExpandable,
        rowExpanded,
        selected,
        onItemSelectToggle: toggleSelected,
      })}
      {rowExpanded && (
        <div className={expandedPanelClassName}>{React.createElement(rowExpandedComponent, { item, ...rowProps })}</div>
      )}
    </div>
  )
}
