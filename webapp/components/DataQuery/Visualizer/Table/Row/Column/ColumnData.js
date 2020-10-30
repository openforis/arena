import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'
import * as NumberUtils from '@core/numberUtils'
import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/store/system'

import { useColumn } from './store'

const formatters = {
  [NodeDef.nodeDefType.boolean]: ({ value, i18n, nodeDef }) =>
    i18n.t(`surveyForm.nodeDefBoolean.labelValue.${NodeDef.getLabelValue(nodeDef)}.${value}`),
  [NodeDef.nodeDefType.date]: ({ value }) => DateUtils.format(DateUtils.parseISO(value), 'dd/MM/yyyy'),
  [NodeDef.nodeDefType.decimal]: ({ value }) => NumberUtils.formatDecimal(value),
  [NodeDef.nodeDefType.integer]: ({ value }) => NumberUtils.formatInteger(value),
  [NodeDef.nodeDefType.time]: ({ value }) => DateUtils.format(DateUtils.parse(value, 'HH:mm:ss'), 'HH:mm'),
}

const getColValue = ({ nodeDef, col, row, i18n }) => {
  const value = Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null
  if (A.isNull(value)) {
    return ''
  }
  const formatter = formatters[NodeDef.getType(nodeDef)]
  return formatter ? formatter({ i18n, nodeDef, value }) : value
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
