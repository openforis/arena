import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Query } from '@common/model/query'

import Table from './Table'

const components = {
  [Query.displayTypes.table]: Table,
}

const Visualizer = (props) => {
  const {
    query,
    data,
    dataEmpty,
    dataLoading,
    dataLoadingError,
    nodeDefLabelType,
    nodeDefsSelectorVisible,
    offset,
    onChangeQuery,
    setData,
  } = props

  return (
    <div className="table__content">
      {React.createElement(components[Query.getDisplayType(query)], {
        query,
        data,
        dataEmpty,
        dataLoading,
        dataLoadingError,
        nodeDefLabelType,
        nodeDefsSelectorVisible,
        offset,
        onChangeQuery,
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
  nodeDefsSelectorVisible: PropTypes.bool.isRequired,
  offset: PropTypes.number.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  query: PropTypes.object.isRequired,
  setData: PropTypes.func.isRequired,
}

Visualizer.defaultProps = {
  dataLoadingError: false,
}

export default memo(Visualizer)
