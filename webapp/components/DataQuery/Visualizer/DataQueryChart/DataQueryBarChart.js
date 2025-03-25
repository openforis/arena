import React from 'react'
import PropTypes from 'prop-types'

import { BarChart } from '@webapp/charts/BarChart'
import { useDataQueryChartData } from './useDataQueryChartData'

export const DataQueryBarChart = (props) => {
  const { data, nodeDefLabelType } = props

  const { chartData, dataColors, dataKeys, labelDataKey } = useDataQueryChartData({ data, nodeDefLabelType })

  return <BarChart data={chartData} dataColors={dataColors} dataKeys={dataKeys} labelDataKey={labelDataKey} />
}

DataQueryBarChart.propTypes = {
  data: PropTypes.array.isRequired,
  nodeDefLabelType: PropTypes.string,
}
