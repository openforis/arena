import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import TableColumn from './tableColumn'

const TableColumns = ({ nodeDefCols, row, colWidth, editMode = false }) =>
  nodeDefCols.map((nodeDef) => (
    <TableColumn key={NodeDef.getUuid(nodeDef)} nodeDef={nodeDef} row={row} colWidth={colWidth} editMode={editMode} />
  ))

TableColumns.propTypes = {
  nodeDefCols: PropTypes.array.isRequired,
  row: PropTypes.object.isRequired,
  colWidth: PropTypes.number.isRequired,
  editMode: PropTypes.bool,
}

TableColumns.defaultProps = {
  editMode: false,
}

export default TableColumns
