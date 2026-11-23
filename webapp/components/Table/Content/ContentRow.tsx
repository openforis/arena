import React, { memo, useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { isEventFromInteractiveChild } from '@webapp/utils/domUtils'

const expandedPanelClassName = 'table__row-expanded-panel-wrapper'

// clicks on the controls in the row or in its expanded panel must not select or open the row
const isEventFromRowCells = (event) => {
  if (isEventFromInteractiveChild(event)) return false
  const expandedPanel = event.target.closest(`.${expandedPanelClassName}`)
  return !expandedPanel || !event.currentTarget.contains(expandedPanel)
}

const ContentRowComponent = (props) => {
  const {
    cellProps,
    cellTestIdExtractor,
    columns,
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
        // props of the default row component (ContentRowCells), used when the table has columns
        ...(columns ? { cellProps, columns, itemSelected: selected } : {}),
        onItemSelectToggle: toggleSelected,
      })}
      {rowExpanded && (
        <div className={expandedPanelClassName}>{React.createElement(rowExpandedComponent, { item, ...rowProps })}</div>
      )}
    </div>
  )
}

ContentRowComponent.propTypes = {
  cellProps: PropTypes.object,
  cellTestIdExtractor: PropTypes.func,
  columns: PropTypes.array,
  expandableRows: PropTypes.bool,
  gridTemplateColumns: PropTypes.string,
  index: PropTypes.number.isRequired,
  initData: PropTypes.func,
  isRowActive: PropTypes.func,
  isRowExpandable: PropTypes.func,
  isRowOpenable: PropTypes.func,
  item: PropTypes.object.isRequired,
  module: PropTypes.string,
  offset: PropTypes.number,
  onItemSelectToggle: PropTypes.func.isRequired,
  onRowOpen: PropTypes.func,
  rowComponent: PropTypes.elementType.isRequired,
  rowExpandedComponent: PropTypes.elementType,
  rowProps: PropTypes.object,
  selectable: PropTypes.bool,
  selected: PropTypes.bool,
}

// memoized: a change in the table (e.g. a row selected) re-renders only the rows whose props changed
export const ContentRow = memo(ContentRowComponent)
