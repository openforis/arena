import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { ValueFormatter } from '../../../../valueFormatter'

import { useColumn } from './store'

const getColValue = ({ nodeDef, col, row, i18n }) => {
  const value = Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null
  return ValueFormatter.format({ i18n, nodeDef, value })
}

const ColumnData = (props) => {
  const { colWidth, nodeDef, query, row } = props
  const i18n = useI18n()

  const { columnNames, widthInner, widthOuter } = useColumn({ nodeDef, query, colWidth })

  return (
    <div className="table__cell" style={{ width: widthOuter }}>
      <div className="table__inner-cell">
        {columnNames.map((col) => (
          <div key={col} style={{ width: widthInner }} className="ellipsis">
            {getColValue({ nodeDef, col, row, i18n })}
          </div>
        ))}
      </div>
    </div>
  )
}

ColumnData.propTypes = {
  colWidth: PropTypes.number.isRequired,
  nodeDef: PropTypes.object.isRequired,
  query: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
}

export default ColumnData
