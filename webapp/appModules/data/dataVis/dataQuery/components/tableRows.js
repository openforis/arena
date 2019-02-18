import React from 'react'

import TableColumn from './tableColumn'

const defaultColWidth = 80

const TableColumns = ({ nodeDefCols, row, lang, colWidth }) => (
  nodeDefCols.map(nodeDef =>
    <TableColumn key={nodeDef.id}
                 nodeDef={nodeDef} row={row}
                 lang={lang} colWidth={colWidth}/>
  )
)

const TableRows = ({ nodeDefCols, colNames, data, offset, lang, colWidth }) => (
  <div className="table__rows">

    <div className="table__row-header">
      <div style={{ width: defaultColWidth }}>Row #</div>
      <TableColumns nodeDefCols={nodeDefCols} lang={lang} colWidth={colWidth}/>
    </div>


    <div className="table__data-rows">
      {
        data.map((row, i) =>
          <div key={i} className="table__row">
            <div style={{ width: defaultColWidth }}>{i + offset + 1}</div>
            <TableColumns nodeDefCols={nodeDefCols} row={row} colWidth={colWidth}/>
          </div>
        )
      }
    </div>
  </div>
)

export default TableRows