import React from 'react'

import { Button } from '@webapp/components/buttons'

import { ContentRowCell } from './ContentRowCell'

export const ContentRowCells = (props) => {
  const { columns, expandableRows, onRowExpandToggle, row, rowExpanded } = props

  return (
    <>
      {columns.map((column) => (
        <ContentRowCell key={column.key} column={column} row={row} />
      ))}
      {expandableRows && (
        <div>
          <Button
            iconClassName={rowExpanded ? 'icon-circle-up' : 'icon-circle-down'}
            title="common.expandCollapse"
            onClick={onRowExpandToggle}
          />
        </div>
      )}
    </>
  )
}
