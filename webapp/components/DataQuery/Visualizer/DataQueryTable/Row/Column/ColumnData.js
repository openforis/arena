import React from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { ValueFormatter } from '../../../../valueFormatter'

import { useColumn } from './store'

const getColValue = ({ survey, nodeDef, col, row, i18n }) => {
  const value = Object.hasOwn(row, col) ? row[col] : null
  if (Objects.isEmpty(value)) return ''
  const values = Array.isArray(value) ? value : [value]
  return values
    .map((val) => ValueFormatter.format({ i18n, survey, nodeDef, value: val }))
    .filter((val) => !Objects.isEmpty(val))
    .join(', ')
}

const ColumnData = (props) => {
  const { codesVisible, colWidth, nodeDef, query, row } = props
  const i18n = useI18n()
  const survey = useSurvey()

  const { columnNames, widthInner, widthOuter } = useColumn({ codesVisible, nodeDef, query, colWidth })

  return (
    <div className="table__cell" style={{ width: widthOuter }}>
      <div className="table__inner-cell">
        {columnNames.map((col) => (
          <div key={col} style={{ width: widthInner }} className="ellipsis">
            {getColValue({ survey, nodeDef, col, row, i18n })}
          </div>
        ))}
      </div>
    </div>
  )
}

ColumnData.propTypes = {
  codesVisible: PropTypes.bool.isRequired,
  colWidth: PropTypes.number.isRequired,
  nodeDef: PropTypes.object.isRequired,
  query: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
}

export default ColumnData
