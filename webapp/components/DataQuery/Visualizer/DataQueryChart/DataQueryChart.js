import './DataQueryChart.scss'

import React, { useRef } from 'react'
import PropTypes from 'prop-types'

import { DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'
import { useI18n } from '@webapp/store/system'

import { ButtonDownload } from '@webapp/components/buttons'
import { downloadSvgToPng } from '@webapp/utils/domUtils'

import { DataQueryAreaChart } from './DataQueryAreaChart'
import { DataQueryBarChart } from './DataQueryBarChart'
import { DataQueryPieChart } from './DataQueryPieChart'
import { DataQueryLineChart } from './DataQueryLineChart'
import { DataQueryScatterChart } from './DataQueryScatterChart'

const componentsByType = {
  [DataExplorerState.chartTypes.area]: DataQueryAreaChart,
  [DataExplorerState.chartTypes.bar]: DataQueryBarChart,
  [DataExplorerState.chartTypes.line]: DataQueryLineChart,
  [DataExplorerState.chartTypes.pie]: DataQueryPieChart,
  [DataExplorerState.chartTypes.scatter]: DataQueryScatterChart,
}

export const DataQueryChart = (props) => {
  const { data, dataEmpty, dataLoading, nodeDefLabelType } = props

  const i18n = useI18n()
  const chartType = DataExplorerSelectors.useChartType()

  const wrapperRef = useRef()

  const downloadChartToPng = () => {
    const chartWrapper = wrapperRef.current
    const svgElement = chartWrapper.querySelector('svg')
    if (svgElement) {
      downloadSvgToPng(svgElement)
    }
  }

  if (dataLoading) {
    return null
  }
  if (dataEmpty) {
    return i18n.t('dataView.dataVis.noData')
  }

  return (
    <div className="data-query-chart-external-container">
      <ButtonDownload
        className="btn-download"
        onClick={downloadChartToPng}
        showLabel={false}
        title="dataView.charts.downloadToPng"
      />
      <div className="data-query-chart-wrapper" ref={wrapperRef}>
        {React.createElement(componentsByType[chartType], { data, nodeDefLabelType })}
      </div>
    </div>
  )
}

DataQueryChart.propTypes = {
  data: PropTypes.array,
  dataEmpty: PropTypes.bool,
  dataLoading: PropTypes.bool,
  nodeDefLabelType: PropTypes.string,
}
