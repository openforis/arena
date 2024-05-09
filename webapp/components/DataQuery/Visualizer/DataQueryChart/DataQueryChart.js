import React from 'react'
import PropTypes from 'prop-types'

import { DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'
import { useI18n } from '@webapp/store/system'

import { DataQueryBarChart } from './DataQueryBarChart'
import { DataQueryPieChart } from './DataQueryPieChart'

const componentsByType = {
  [DataExplorerState.chartTypes.bar]: DataQueryBarChart,
  [DataExplorerState.chartTypes.pie]: DataQueryPieChart,
}

export const DataQueryChart = (props) => {
  const { data, dataEmpty, dataLoading, nodeDefLabelType } = props

  const i18n = useI18n()
  const chartType = DataExplorerSelectors.useChartType()

  if (dataLoading) {
    return null
  }
  if (dataEmpty) {
    return i18n.t('dataView.dataVis.noData')
  }
  return React.createElement(componentsByType[chartType], { data, nodeDefLabelType })
}

DataQueryChart.propTypes = {
  data: PropTypes.array,
  dataEmpty: PropTypes.bool,
  dataLoading: PropTypes.bool,
  nodeDefLabelType: PropTypes.string,
}
