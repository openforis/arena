import React, { useCallback, useState } from 'react'
import classNames from 'classnames'

export const ContentRow = (props) => {
  const {
    cellTestIdExtractor,
    expandableRows,
    gridTemplateColumns,
    index,
    initData,
    isRowActive,
    isRowExpandable,
    module,
    offset,
    onRowClick,
    item,
    rowComponent,
    rowExpandedComponent,
    rowProps,
  } = props

  const [rowExpanded, setRowExpanded] = useState(false)

  const active = isRowActive && isRowActive(item)
  const className = classNames('table__row', { hoverable: Boolean(onRowClick), active, expanded: rowExpanded })

  const onRowExpandToggle = () => setRowExpanded((oldExpanded) => !oldExpanded)
  const height = rowExpanded ? '300px' : '35px'

  const itemPosition = index + offset + 1

  const onClick = useCallback(async () => {
    if (onRowClick) {
      await onRowClick(item)
    }
  }, [item, onRowClick])

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/interactive-supports-focus
    <>
      <div
        key={String(index)}
        data-testid={`${module}_${index}`}
        role="button"
        onClick={onClick}
        className={className}
        style={{ gridTemplateColumns, height }}
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
          row: item, // TODO remove it and pass only item
          rowNo: itemPosition, // TODO remove it and pass only itemPosition
          onRowExpandToggle,
          expandableRows,
          isRowExpandable,
          rowExpanded,
        })}
        {rowExpanded && (
          <div className="table__row-expanded-panel-wrapper">
            {React.createElement(rowExpandedComponent, { item, ...rowProps })}
          </div>
        )}
      </div>
    </>
  )
}
