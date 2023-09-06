import React from 'react'

import { Button } from '@webapp/components/buttons'

import { ContentRowCell } from './ContentRowCell'

export const ContentRowCells = (props) => {
  const {
    active,
    cellTestIdExtractor,
    columns,
    expandableRows,
    initData,
    isRowExpandable,
    item,
    itemPosition,
    itemSelected,
    onRowExpandToggle,
    rowExpanded,
  } = props

  return (
    <>
      {columns.map((column) => (
        <ContentRowCell
          key={column.key}
          active={active}
          cellTestIdExtractor={cellTestIdExtractor}
          column={column}
          initData={initData}
          item={item}
          itemPosition={itemPosition}
          itemSelected={itemSelected}
        />
      ))}
      {expandableRows && (
        <div>
          <Button
            iconClassName={rowExpanded ? 'icon-circle-up' : 'icon-circle-down'}
            disabled={!isRowExpandable({ item })}
            title="common.expandCollapse"
            onClick={onRowExpandToggle}
          />
        </div>
      )}
    </>
  )
}
