import React from 'react'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'

import { ContentRowCell } from './ContentRowCell'

export const ContentRowCells = (props) => {
  const {
    active,
    cellProps = {},
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
          {...cellProps}
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

ContentRowCells.propTypes = {
  active: PropTypes.bool,
  cellProps: PropTypes.object,
  cellTestIdExtractor: PropTypes.func,
  columns: PropTypes.array.isRequired,
  expandableRows: PropTypes.bool,
  initData: PropTypes.func,
  isRowExpandable: PropTypes.func.isRequired,
  item: PropTypes.object.isRequired,
  itemPosition: PropTypes.number.isRequired,
  itemSelected: PropTypes.bool,
  onRowExpandToggle: PropTypes.func.isRequired,
  rowExpanded: PropTypes.bool,
}
