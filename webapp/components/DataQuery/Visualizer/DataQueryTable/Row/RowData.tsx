import classNames from 'classnames'

import { Query } from '@common/model/query'
import * as NodeDef from '@core/survey/nodeDef'

import { ColumnData, ColumnDataEdit } from './Column'
import LinkRecord from './LinkRecord'
import type { ArenaAnyNodeDef } from '@openforis/arena-core'

type RowDataProps = {
  className?: string
  codesVisible: boolean
  colIndexWidth: number
  colWidth: number
  nodeDefCols: ArenaAnyNodeDef[]
  query: Query.QueryItem
  row: Record<string, any>
  // row number or label (e.g. total row)
  rowNo: number | string
  totals?: Record<string, any>
}

const RowData = (props: RowDataProps) => {
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

export default RowData
