import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { valueFormatters } from '../../../../valueFormatters'

import { useColumn } from './store'

const getColValue = ({ nodeDef, col, row, i18n }) => {
  const value = Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null
  if (A.isNull(value)) {
    return ''
  }
  const formatter = valueFormatters[NodeDef.getType(nodeDef)]
  return formatter ? formatter({ i18n, nodeDef, value }) : value
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
