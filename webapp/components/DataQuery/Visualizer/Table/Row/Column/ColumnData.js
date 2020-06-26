import './columnData.scss'
import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NumberUtils from '@core/numberUtils'

import ProgressBar from '@webapp/components/progressBar'

import { useColumn } from './store'

const isColFetched = ({ col, row }) => Object.prototype.hasOwnProperty.call(row, col)

const getColValue = ({ nodeDef, col, row }) => {
  const value = Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null
  if (NodeDef.isInteger(nodeDef)) return NumberUtils.formatInteger(value)
  if (NodeDef.isDecimal(nodeDef)) return NumberUtils.formatDecimal(value)
  return value
}

const ColumnData = (props) => {
  const { colWidth, nodeDef, query, row } = props

  const { colNames, widthInner, widthOuter } = useColumn({ nodeDef, query, colWidth })

  return (
    <div className="table__cell" style={{ width: widthOuter }}>
      <div className="table__inner-cell">
        {colNames.map((col) => {
          const colFetched = isColFetched({ col, row })
          const colValue = getColValue({ nodeDef, col, row })

          return (
            <div key={col} style={{ width: widthInner }} className="ellipsis">
              {colFetched ? (
                colValue
              ) : (
                <div className="data-query-column-data__progress-bar">
                  <ProgressBar className="running progress-bar-striped" progress={100} showText={false} />
                </div>
              )}
            </div>
          )
        })}
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
