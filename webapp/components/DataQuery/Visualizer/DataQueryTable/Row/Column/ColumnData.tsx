import { Fragment } from 'react'

import type { ArenaAnyNodeDef } from '@openforis/arena-core'
import { Numbers, Objects } from '@openforis/arena-core'

import { DataQueryValueFormatter } from '@common/analysis/dataQueryValueFormatter'
import { Query } from '@common/model/query'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { useColumn } from './store'

const getColValue = ({ survey, nodeDef, col, row, i18n, isMeasure }) => {
  const value = Object.hasOwn(row, col) ? row[col] : null
  if (Objects.isEmpty(value)) return ''
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
            <div style={{ width: widthInner }} className="ellipsis">
              {getColValue({ survey, nodeDef, col, row, i18n, isMeasure })}
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
