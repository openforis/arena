import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Query } from '@common/model/query'
import * as NodeDef from '@core/survey/nodeDef'

import { ColumnData, ColumnDataEdit } from './Column'
import LinkRecord from './LinkRecord'

const RowData = (props) => {
  const { className, codesVisible, colIndexWidth, colWidth, nodeDefCols, query, row, rowNo, totals = null } = props

  return (
    <div key={rowNo} className={classNames('table__row', className)}>
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
          <ColumnData
            key={NodeDef.getUuid(nodeDef)}
            codesVisible={codesVisible}
            query={query}
            colWidth={colWidth}
            nodeDef={nodeDef}
            row={row}
            totals={totals}
          />
        )
      )}
    </div>
  )
}

RowData.propTypes = {
  className: PropTypes.string,
  codesVisible: PropTypes.bool.isRequired,
  colIndexWidth: PropTypes.number.isRequired,
  colWidth: PropTypes.number.isRequired,
  nodeDefCols: PropTypes.arrayOf(Object).isRequired,
  query: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
  // row number or label (e.g. total row)
  rowNo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  totals: PropTypes.object,
}

export default RowData
