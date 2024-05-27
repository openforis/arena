import React from 'react'
import PropTypes from 'prop-types'

import { LineChart } from '@webapp/charts/LineChart'
import { useDataQueryChartData } from './useDataQueryChartData'

export const DataQueryLineChart = (props) => {
  const { data, nodeDefLabelType } = props

  const { chartData, dataColors, dataKeys, labelDataKey } = useDataQueryChartData({ data, nodeDefLabelType })

  return (
    <LineChart data={chartData} dataColors={dataColors} dataKeys={dataKeys} labelDataKey={labelDataKey} showLegend />
  )
}

DataQueryLineChart.propTypes = {
  data: PropTypes.array.isRequired,
  nodeDefLabelType: PropTypes.string,
}
