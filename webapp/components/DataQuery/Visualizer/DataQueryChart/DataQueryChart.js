import React from 'react'
import PropTypes from 'prop-types'

import { DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'

import { DataQueryBarChart } from './DataQueryBarChart'

export const DataQueryChart = (props) => {
  const { data, dataEmpty, dataLoading, nodeDefLabelType } = props

  const chartType = DataExplorerSelectors.useChartType()

  if (dataEmpty || dataLoading) {
    return null
  }

  if (chartType === DataExplorerState.chartTypes.bar) {
    return <DataQueryBarChart data={data} nodeDefLabelType={nodeDefLabelType} />
  }
  return null
}

DataQueryChart.propTypes = {
  data: PropTypes.array,
  dataEmpty: PropTypes.bool,
  dataLoading: PropTypes.bool,
  nodeDefLabelType: PropTypes.string,
}
