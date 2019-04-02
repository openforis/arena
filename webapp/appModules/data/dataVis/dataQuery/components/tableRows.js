import React from 'react'

import NodeDef from '../../../../../../common/survey/nodeDef'

import TableColumn from './tableColumn'

const defaultColWidth = 80

const TableColumns = ({ nodeDefCols, row, lang, colWidth, editMode = false }) => (
  nodeDefCols.map(nodeDef =>
    <TableColumn key={NodeDef.getUuid(nodeDef)}
                 nodeDef={nodeDef}
                 row={row}
                 lang={lang}
                 colWidth={colWidth}
                 editMode={editMode}/>
  )
)

const TableRows = ({ nodeDefCols, colNames, data, offset, lang, colWidth, editMode }) => (
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
            <TableColumns nodeDefCols={nodeDefCols} row={row} colWidth={colWidth} editMode={editMode}/>
          </div>
        )
      }
    </div>
  </div>
)

export default TableRows