import { Fragment } from 'react'

import type { ArenaAnyNodeDef, ArenaSRSIndex } from '@openforis/arena-core'
import { Numbers, Objects, Points } from '@openforis/arena-core'

import { DataQueryValueFormatter } from '@common/analysis/dataQueryValueFormatter'
import { Query } from '@common/model/query'
import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'
import { useSurvey, useSurveySrsIndex } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { useColumn } from './store'

// ~1 m precision: keeps "lat, lon" short enough to fit the column
const LAT_LONG_DECIMAL_DIGITS = 5

// The coordinate point column holds an EWKT string (SRID=EPSG:xxxx;POINT(x y)), too long for the cell:
// show it as WGS84 "lat, lon" instead (x, y and srs are already shown in their own columns)
const isCoordinatePointColumn = ({ nodeDef, col, isMeasure }) =>
  !isMeasure && NodeDef.isCoordinate(nodeDef) && col === NodeDef.getName(nodeDef)

const formatCoordinatePoint = ({ value, srsIndex }: { value: string; srsIndex: ArenaSRSIndex }): string => {
  const point = Points.parse(StringUtils.prependIfMissing('SRID=')(value))
  const pointLatLong = point && Points.isValid(point, srsIndex) ? Points.toLatLong(point, srsIndex) : null
  if (!pointLatLong) return value
  const lat = Numbers.roundToPrecision(pointLatLong.y, LAT_LONG_DECIMAL_DIGITS)
  const long = Numbers.roundToPrecision(pointLatLong.x, LAT_LONG_DECIMAL_DIGITS)
  return `${lat}, ${long}`
}

const getColValue = ({ survey, srsIndex, nodeDef, col, row, i18n, isMeasure }) => {
  const value = Object.hasOwn(row, col) ? row[col] : null
  if (Objects.isEmpty(value)) return ''
  if (isCoordinatePointColumn({ nodeDef, col, isMeasure })) return formatCoordinatePoint({ value, srsIndex })
  const values = Array.isArray(value) ? value : [value]
  return values
    .map((val) => DataQueryValueFormatter.format({ i18n, survey, nodeDef, value: val, isMeasure }))
    .filter((val) => !Objects.isEmpty(val))
    .join(', ')
}

const formatPercentage = ({ value, total }) => {
  const totalNumber = Number(total)
  if (Objects.isEmpty(value) || !totalNumber) return ''
  return `${Numbers.roundToPrecision((Number(value) * 100) / totalNumber, 2)} %`
}

type ColumnDataProps = {
  codesVisible: boolean
  colWidth: number
  nodeDef: ArenaAnyNodeDef
  query: Query.QueryItem
  row: Record<string, any>
  totals?: Record<string, any>
}

const ColumnData = (props: ColumnDataProps) => {
  const { codesVisible, colWidth, nodeDef, query, row, totals = null } = props
  const i18n = useI18n()
  const survey = useSurvey()
  const srsIndex = useSurveySrsIndex()

  const { columnNames, isMeasure, percentageColumnsVisible, widthInner, widthOuter } = useColumn({
    codesVisible,
    nodeDef,
    query,
    colWidth,
    percentageVisible: Boolean(totals),
  })

  return (
    <div className="table__cell" style={{ width: widthOuter }}>
      <div className="table__inner-cell">
        {columnNames.map((col) => (
          <Fragment key={col}>
            <div
              style={{ width: widthInner }}
              className="ellipsis"
              title={isCoordinatePointColumn({ nodeDef, col, isMeasure }) ? row[col] : undefined}
            >
              {getColValue({ survey, srsIndex, nodeDef, col, row, i18n, isMeasure })}
            </div>
            {percentageColumnsVisible && (
              <div style={{ width: widthInner }} className="ellipsis">
                {formatPercentage({ value: row[col], total: totals[col] })}
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export default ColumnData
