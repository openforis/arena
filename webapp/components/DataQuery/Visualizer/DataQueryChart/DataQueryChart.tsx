import './DataQueryChart.scss'

import React, { useRef } from 'react'

import { DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'
import { useI18n } from '@webapp/store/system'

import { ButtonDownload } from '@webapp/components/buttons'
import { downloadMultipleSvgsToPng } from '@webapp/utils/chartExportUtils'

import { DataQueryAreaChart } from './DataQueryAreaChart'
import { DataQueryBarChart } from './DataQueryBarChart'
import { DataQueryPieChart } from './DataQueryPieChart'
import { DataQueryLineChart } from './DataQueryLineChart'
import { DataQueryScatterChart } from './DataQueryScatterChart'
import type { NodeDefLabelType } from '@core/survey/nodeDef'

const componentsByType: Record<string, React.ComponentType<any>> = {
  [DataExplorerState.chartTypes.area]: DataQueryAreaChart,
  [DataExplorerState.chartTypes.bar]: DataQueryBarChart,
  [DataExplorerState.chartTypes.line]: DataQueryLineChart,
  [DataExplorerState.chartTypes.pie]: DataQueryPieChart,
  [DataExplorerState.chartTypes.scatter]: DataQueryScatterChart,
}

type DataQueryChartProps = {
  data?: any[]
  dataCount?: number
  dataEmpty?: boolean
  dataLoading?: boolean
  nodeDefLabelType?: NodeDefLabelType
}

export const DataQueryChart = (props: DataQueryChartProps) => {
  const { data, dataCount, dataEmpty, dataLoading, nodeDefLabelType } = props

  const i18n = useI18n()
  const chartType = DataExplorerSelectors.useChartType()

  const wrapperRef = useRef<HTMLDivElement>(null)

  const downloadChartToPng = () => {
    const chartWrapperEl = wrapperRef.current
    const svgElements = Array.from(chartWrapperEl.querySelectorAll('svg'))

    if (svgElements.length > 0) {
      downloadMultipleSvgsToPng(svgElements, chartWrapperEl)
    }
  }

  if (dataLoading) {
    return null
  }
  if (dataEmpty) {
    return i18n.t('dataView:dataVis.noData')
  }

  return (
    <div className="data-query-chart-external-container">
      <ButtonDownload
        className="btn-download"
        onClick={downloadChartToPng}
        showLabel={false}
        title="dataView:charts.downloadToPng"
      />
      <div className="data-query-chart-wrapper" ref={wrapperRef}>
        {React.createElement(componentsByType[chartType], { data, dataCount, nodeDefLabelType })}
      </div>
    </div>
  )
}
