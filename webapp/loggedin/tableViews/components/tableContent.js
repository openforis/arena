import React from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'
import * as TableViewsState from '@webapp/loggedin/tableViews/tableViewsState'

const TableContent = (props) => {
  const {
    gridTemplateColumns,
    module,
    isRowActive,
    noItemsLabelKey,
    onRowClick,
    rowHeaderComponent,
    rowComponent,
  } = props

  const i18n = useI18n()
  const list = useSelector(TableViewsState.getList(module))

  return R.isEmpty(list) ? (
    <div className="table__empty-rows">{i18n.t(noItemsLabelKey)}</div>
  ) : (
    <div className="table__content">
      <div className="table__row-header" style={{ gridTemplateColumns }}>
        {React.createElement(rowHeaderComponent, props)}
      </div>
      <div className="table__rows">
        {list.map((row, i) => {
          let className = 'table__row'
          className += onRowClick ? ' hoverable' : ''
          className += isRowActive && isRowActive(row) ? ' active' : ''

          return (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/interactive-supports-focus
            <div
              role="button"
              key={String(i)}
              onClick={() => onRowClick && onRowClick(row)}
              className={className}
              style={{ gridTemplateColumns }}
            >
              {React.createElement(rowComponent, { ...props, idx: i, row })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

TableContent.propTypes = {
  gridTemplateColumns: PropTypes.string.isRequired,
  isRowActive: PropTypes.func,
  module: PropTypes.string.isRequired,
  noItemsLabelKey: PropTypes.string.isRequired,
  onRowClick: PropTypes.func,
  rowHeaderComponent: PropTypes.elementType.isRequired,
  rowComponent: PropTypes.elementType.isRequired,
}

TableContent.defaultProps = {
  isRowActive: null,
  onRowClick: null,
}

export default TableContent
