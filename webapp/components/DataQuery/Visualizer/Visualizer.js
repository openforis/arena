import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Query } from '@common/model/query'

import Table from './Table'

const components = {
  [Query.displayTypes.table]: Table,
}

const Visualizer = (props) => {
  const { query, data, dataEmpty, nodeDefsSelectorVisible, offset, setData } = props

  return (
    <div className="table__content">
      {React.createElement(components[Query.getDisplayType(query)], {
        query,
        data,
        dataEmpty,
        nodeDefsSelectorVisible,
        offset,
        setData,
      })}
    </div>
  )
}

Visualizer.propTypes = {
  data: PropTypes.array.isRequired,
  dataEmpty: PropTypes.bool.isRequired,
  nodeDefsSelectorVisible: PropTypes.bool.isRequired,
  offset: PropTypes.number.isRequired,
  query: PropTypes.object.isRequired,
  setData: PropTypes.func.isRequired,
}

export default memo(Visualizer)
