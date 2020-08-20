import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'
import * as NumberUtils from '@core/numberUtils'

import { useI18n } from '@webapp/store/system'

import { useColumn } from './store'

const getColValue = ({ nodeDef, col, row, i18n }) => {
  const value = Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null
  if (NodeDef.isInteger(nodeDef)) return NumberUtils.formatInteger(value)
  if (NodeDef.isDecimal(nodeDef)) return NumberUtils.formatDecimal(value)
  if (NodeDef.isBoolean(nodeDef))
    return A.isNull(value)
      ? ''
      : i18n.t(`surveyForm.nodeDefBoolean.labelValue.${NodeDef.getLabelValueType(nodeDef)}.${value}`)
  return value
}

const ColumnData = (props) => {
  const { colWidth, nodeDef, query, row } = props
  const i18n = useI18n()

  const { colNames, widthInner, widthOuter } = useColumn({ nodeDef, query, colWidth })

  return (
    <div className="table__cell" style={{ width: widthOuter }}>
      <div className="table__inner-cell">
        {colNames.map((col) => (
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
