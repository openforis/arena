import React from 'react'

import TableRow from './tableRow'

const TableRows = props => {
  const {reportItems} = props

  return (
    <div className="table__content">
      <div className="table__rows">
        {
          reportItems.map((item, i) => {
            return (
              <TableRow
                key={i}
                idx={i}
                item={item}
              />
            )
          })
        }
      </div>
    </div>
  )
}

export default TableRows
