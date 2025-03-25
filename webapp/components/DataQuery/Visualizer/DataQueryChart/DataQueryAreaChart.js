import React from 'react'
import PropTypes from 'prop-types'

import { AreaChart } from '@webapp/charts/AreaChart'
import { useDataQueryChartData } from './useDataQueryChartData'

export const DataQueryAreaChart = (props) => {
  const { data, nodeDefLabelType } = props

  const { chartData, dataColors, dataKeys, labelDataKey } = useDataQueryChartData({ data, nodeDefLabelType })

  return (
    <AreaChart data={chartData} dataColors={dataColors} dataKeys={dataKeys} labelDataKey={labelDataKey} showLegend />
  )
}

DataQueryAreaChart.propTypes = {
  data: PropTypes.array.isRequired,
  nodeDefLabelType: PropTypes.string,
}
