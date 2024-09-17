import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'

import { DataQueryChart } from './DataQueryChart'
import DataQueryTable from './DataQueryTable'

const components = {
  [DataExplorerState.displayTypes.chart]: DataQueryChart,
  [DataExplorerState.displayTypes.table]: DataQueryTable,
}

const Visualizer = (props) => {
  const { data, dataEmpty, dataLoading, dataLoadingError = false, nodeDefLabelType, offset, setData } = props

  const displayType = DataExplorerSelectors.useDisplayType()

  return (
    <div className="table__content">
      {React.createElement(components[displayType], {
        data,
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

Visualizer.propTypes = {
  data: PropTypes.array,
  dataEmpty: PropTypes.bool.isRequired,
  dataLoading: PropTypes.bool.isRequired,
  dataLoadingError: PropTypes.bool,
  nodeDefLabelType: PropTypes.string.isRequired,
  offset: PropTypes.number.isRequired,
  setData: PropTypes.func.isRequired,
}

export default memo(Visualizer)
