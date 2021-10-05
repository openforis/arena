import React, { useState } from 'react'
import classNames from 'classnames'

export const ContentRow = (props) => {
  const {
    expandableRows,
    gridTemplateColumns,
    index,
    initData,
    isRowActive,
    module,
    offset,
    onRowClick,
    row,
    rowComponent,
    rowExpandedComponent,
    rowProps,
  } = props

  const [rowExpanded, setRowExpanded] = useState(false)

  const active = isRowActive && isRowActive(row)
  const className = classNames('table__row', { hoverable: Boolean(onRowClick), active, expanded: rowExpanded })

  const onRowExpandToggle = () => setRowExpanded((oldExpanded) => !oldExpanded)
  const height = rowExpanded ? '300px' : '35px'

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/interactive-supports-focus
    <>
      <div
        key={String(index)}
        data-testid={`${module}_${index}`}
        role="button"
        onClick={() => onRowClick && onRowClick(row)}
        className={className}
        style={{ gridTemplateColumns, height }}
      >
        {React.createElement(rowComponent, {
          idx: index,
          offset,
          row,
          rowNo: index + offset + 1,
          active,
          initData,
          ...rowProps,
          expandableRows,
          onRowExpandToggle,
          rowExpanded,
        })}
        {rowExpanded && (
          <div className="table__row-expanded-panel-wrapper">
            {React.createElement(rowExpandedComponent, { row, ...rowProps })}
          </div>
        )}
      </div>
    </>
  )
}
