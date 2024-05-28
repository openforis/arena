import React from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import * as NumberUtils from '@core/numberUtils'

import { PieChart } from '@webapp/charts/PieChart'
import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { useI18n } from '@webapp/store/system'

import { useDataQueryChartData } from './useDataQueryChartData'

const maxItems = 20
const RADIAN = Math.PI / 180
const labelFill = 'white'

export const DataQueryPieChart = (props) => {
  const { data, nodeDefLabelType } = props

  const i18n = useI18n()

  const { dataColumnByDimensionNodeDefUuid, dataColumnsByMeasureNodeDefUuid, maxDecimalDigitsByMeasureNodeDefUuid } =
    useDataQueryChartData({
      data,
      nodeDefLabelType,
    })

  const colors = useRandomColors(data.length, { onlyDarkColors: true })

  const firstDimensionNodeDefUuid = Object.keys(dataColumnByDimensionNodeDefUuid)[0]
  const firstMeasureNodeDefUuid = Object.keys(dataColumnsByMeasureNodeDefUuid)[0]
  const maxDecimalDigits = maxDecimalDigitsByMeasureNodeDefUuid[firstMeasureNodeDefUuid]

  if (data.length > maxItems) {
    return i18n.t('dataView.charts.warning.tooManyItemsToShowChart', { maxItems })
  }

  const firstDimensionDataColumn = dataColumnByDimensionNodeDefUuid[firstDimensionNodeDefUuid]
  const firstMeasureDataColumn = dataColumnsByMeasureNodeDefUuid[firstMeasureNodeDefUuid][0]

  const chartData = data.reduce((acc, dataItem, index) => {
    const name = dataItem[firstDimensionDataColumn]
    const dataItemValue = dataItem[firstMeasureDataColumn]
    const value = NumberUtils.roundToPrecision(dataItemValue, maxDecimalDigits)
    if (!Objects.isEmpty(name) && !Number.isNaN(value)) {
      acc.push({ name, value, color: colors[index] })
    }
    return acc
  }, [])

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill={labelFill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return <PieChart data={chartData} label={renderLabel} showLabelLine={false} />
}

DataQueryPieChart.propTypes = {
  data: PropTypes.array.isRequired,
  nodeDefLabelType: PropTypes.string,
}
