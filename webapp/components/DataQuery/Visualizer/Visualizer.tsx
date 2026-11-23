import React, { memo } from 'react'

import { DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'

import { DataQueryChart } from './DataQueryChart'
import DataQueryTable from './DataQueryTable'
import type { NodeDefLabelType } from '@core/survey/nodeDef'

const components: Record<string, React.ComponentType<any>> = {
  [DataExplorerState.displayTypes.chart]: DataQueryChart,
  [DataExplorerState.displayTypes.table]: DataQueryTable,
}

type VisualizerProps = {
  data?: any[]
  dataCount?: number
  dataEmpty: boolean
  dataLoading: boolean
  dataLoadingError?: boolean
  nodeDefLabelType: NodeDefLabelType
  offset: number
  setData: (...args: any[]) => any
}

const Visualizer = (props: VisualizerProps) => {
  const { data, dataCount, dataEmpty, dataLoading, dataLoadingError = false, nodeDefLabelType, offset, setData } = props

  const displayType = DataExplorerSelectors.useDisplayType()

  return (
    <div className="table__content">
      {React.createElement(components[displayType], {
        data,
        dataCount,
        dataEmpty,
        dataLoading,
        dataLoadingError,
        nodeDefLabelType,
        offset,
        setData,
      })}
    </div>
  )
}

export default memo(Visualizer)
