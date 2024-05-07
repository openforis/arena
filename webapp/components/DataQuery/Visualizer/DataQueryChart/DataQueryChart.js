import React from 'react'
import PropTypes from 'prop-types'

import { DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'

import { DataQueryBarChart } from './DataQueryBarChart'
import { DataQueryPieChart } from './DataQueryPieChart'

const componentsByType = {
  [DataExplorerState.chartTypes.bar]: DataQueryBarChart,
  [DataExplorerState.chartTypes.pie]: DataQueryPieChart,
}

export const DataQueryChart = (props) => {
  const { data, dataEmpty, dataLoading, nodeDefLabelType } = props

  const chartType = DataExplorerSelectors.useChartType()

  if (dataEmpty || dataLoading) {
    return null
  }
  return React.createElement(componentsByType[chartType], { data, nodeDefLabelType })
}

DataQueryChart.propTypes = {
  data: PropTypes.array,
  dataEmpty: PropTypes.bool,
  dataLoading: PropTypes.bool,
  nodeDefLabelType: PropTypes.string,
}
