import './visualizer.scss'
import React from 'react'
import PropTypes from 'prop-types'
import { Query } from '@common/model/query'

import ProgressBar from '@webapp/components/progressBar'
import Table from './Table'

const components = {
  [Query.displayTypes.table]: Table,
}

const Visualizer = (props) => {
  const { query, data, dataEmpty, dataLoaded, dataLoading, nodeDefsSelectorVisible, offset } = props

  if (!dataLoading && !dataLoaded) return null

  return (
    <div className="table__content">
      {dataLoading && !dataLoaded ? (
        <ProgressBar
          className="running progress-bar-striped visualizer__progress-bar"
          progress={100}
          showText={false}
        />
      ) : (
        React.createElement(components[Query.getDisplayType(query)], {
          query,
          data,
          dataEmpty,
          nodeDefsSelectorVisible,
          offset,
        })
      )}
    </div>
  )
}

Visualizer.propTypes = {
  query: PropTypes.object.isRequired,
  data: PropTypes.array,
  dataEmpty: PropTypes.bool.isRequired,
  dataLoaded: PropTypes.bool.isRequired,
  dataLoading: PropTypes.bool.isRequired,
  nodeDefsSelectorVisible: PropTypes.bool.isRequired,
  offset: PropTypes.number.isRequired,
}

Visualizer.defaultProps = {
  data: null,
}

export default Visualizer
