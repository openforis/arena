import React from 'react'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

const TableContent = props => {

  const {
    list,
    gridTemplateColumns, noItemsLabelKey,
    rowHeaderComponent, rowComponent,
    onRowClick, isRowActive
  } = props

  const i18n = useI18n()

  return R.isEmpty(list)
    ? (
      <div className="table__empty-rows">
        {i18n.t(noItemsLabelKey)}
      </div>
    )
    : (
      <div className="table__content">
        <div className="table__row-header" style={{ gridTemplateColumns }}>
          {
            React.createElement(rowHeaderComponent, props)
          }
        </div>
        <div className="table__rows">


          {
            list.map((row, i) => {
              let className = 'table__row'
              className += onRowClick ? ' hoverable' : ''
              className += isRowActive && isRowActive(row) ? ' active' : ''

              return (
                <div onClick={() => onRowClick && onRowClick(row)}
                     className={className}
                     key={i}
                     style={{ gridTemplateColumns }}>
                  {
                    React.createElement(
                      rowComponent,
                      { ...props, idx: i, row }
                    )
                  }
                </div>
              )
            })
          }
        </div>
      </div>
    )
}

export default TableContent