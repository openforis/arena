import React from 'react'
import PropTypes from 'prop-types'

import { Query } from '@common/model/query'

import * as NodeDef from '@core/survey/nodeDef'

import { ColumnData, ColumnDataEdit } from './Column'
import LinkRecord from './LinkRecord'

const RowData = (props) => {
  const { colIndexWidth, colWidth, nodeDefCols, query, row, rowNo } = props

  return (
    <div key={rowNo} className="table__row">
      <div style={{ width: colIndexWidth }}>
        {Query.isModeRawEdit(query) ? <LinkRecord row={row} rowNo={rowNo} /> : rowNo}
      </div>

      {nodeDefCols.map((nodeDef) =>
        Query.isModeRawEdit(query) ? (
          <ColumnDataEdit
            key={NodeDef.getUuid(nodeDef)}
            colWidth={colWidth}
            nodeDef={nodeDef}
            query={query}
            row={row}
          />
        ) : (
          <ColumnData key={NodeDef.getUuid(nodeDef)} query={query} colWidth={colWidth} nodeDef={nodeDef} row={row} />
        )
      )}
    </div>
  )
}

RowData.propTypes = {
  colIndexWidth: PropTypes.number.isRequired,
  colWidth: PropTypes.number.isRequired,
  nodeDefCols: PropTypes.arrayOf(Object).isRequired,
  query: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
  rowNo: PropTypes.number.isRequired,
}

export default RowData
